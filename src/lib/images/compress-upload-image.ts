import { isCompatibilityRenderMode } from "@/lib/runtime-compatibility";

// Most attendance photos should land around 150–200 KB. The backend accepts a
// small tolerance up to 300 KB so a usable photo is never discarded merely
// because a device produces a more detailed image.
const TARGET_IMAGE_BYTES = 200 * 1024;
const MAX_UPLOAD_IMAGE_BYTES = 300 * 1024;
const IMAGE_DECODE_TIMEOUT_MS = 12_000;
const HEIC_CONVERSION_TIMEOUT_MS = 18_000;
// Attendance is a time-critical mobile flow. A long quality-search can freeze
// the browser after a camera photo is selected, so use a deliberately small
// set of attempts that still reaches the API's 300 KB ceiling in practice.
const MAX_DIMENSION_STEPS = [720, 480, 360] as const;
const JPEG_QUALITY_STEPS = [0.68, 0.52, 0.4] as const;
const COMPAT_MAX_DIMENSION_STEPS = [640, 480, 360] as const;
const COMPAT_JPEG_QUALITY_STEPS = [0.68, 0.54, 0.42] as const;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/x-jpeg",
  "image/pjpeg",
  "image/jfif",
  "image/png",
  "image/webp",
]);
const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "jpe",
  "jfif",
  "png",
  "webp",
]);
const HEIC_IMAGE_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "image/x-heic",
  "image/x-heif",
]);
const HEIC_IMAGE_EXTENSIONS = new Set(["heic", "heif"]);

export async function compressUploadImage(file: File): Promise<File> {
  const sourceFile = isHeicImageFile(file)
    ? await convertHeicToJpeg(file)
    : file;
  const useCompatibilityProfile = isCompatibilityRenderMode();

  if (!isSupportedImageFile(sourceFile)) {
    throw new Error(
      "Format foto harus JPG/JPEG/JFIF, PNG, WEBP, HEIC, atau HEIF.",
    );
  }

  if (sourceFile.size <= TARGET_IMAGE_BYTES && !useCompatibilityProfile) {
    const normalizedFile = await normalizeImageOrientation(sourceFile);
    if (normalizedFile.size <= MAX_UPLOAD_IMAGE_BYTES) {
      return normalizedFile;
    }
    return compressUploadImage(normalizedFile);
  }

  if (sourceFile.size <= MAX_UPLOAD_IMAGE_BYTES && useCompatibilityProfile) {
    return sourceFile;
  }

  const image = await loadImageSource(sourceFile, useCompatibilityProfile);
  try {
    let bestBlob: Blob | null = null;
    const maxDimensionSteps = useCompatibilityProfile
      ? COMPAT_MAX_DIMENSION_STEPS
      : MAX_DIMENSION_STEPS;
    const qualitySteps = useCompatibilityProfile
      ? COMPAT_JPEG_QUALITY_STEPS
      : JPEG_QUALITY_STEPS;

    for (const maxDimension of maxDimensionSteps) {
      const canvas = renderImageToCanvas(
        image.source,
        image.width,
        image.height,
        maxDimension,
      );
      try {
        for (const quality of qualitySteps) {
          const blob = await canvasToJpegBlob(canvas, quality);
          if (!blob) continue;
          if (!bestBlob || blob.size < bestBlob.size) {
            bestBlob = blob;
          }
          if (blob.size <= TARGET_IMAGE_BYTES) {
            return createCompressedFile(sourceFile, blob);
          }
        }
      } finally {
        releaseCanvas(canvas);
      }
    }

    if (bestBlob && bestBlob.size <= MAX_UPLOAD_IMAGE_BYTES) {
      return createCompressedFile(sourceFile, bestBlob);
    }

    if (sourceFile.size <= MAX_UPLOAD_IMAGE_BYTES) {
      return sourceFile;
    }

    throw new Error(
      "Foto tidak dapat dikompres hingga batas 300 KB. Silakan ambil ulang foto dengan pencahayaan yang lebih baik.",
    );
  } catch (error) {
    if (isDeviceMemoryError(error)) {
      throw new Error(
        "Memori browser tidak cukup untuk menyiapkan foto ini. Tutup aplikasi lain, lalu ambil foto ulang dengan kualitas kamera standar.",
      );
    }
    throw error;
  } finally {
    image.cleanup();
  }
}

function isHeicImageFile(file: File) {
  if (HEIC_IMAGE_TYPES.has(file.type.toLowerCase())) return true;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(extension && HEIC_IMAGE_EXTENSIONS.has(extension));
}

async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const { default: heic2any } = await withTimeout(
      import("heic2any"),
      HEIC_CONVERSION_TIMEOUT_MS,
      "Pemrosesan foto HEIC/HEIF terlalu lama.",
    );
    const converted = await withTimeout(
      heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.82,
      }),
      HEIC_CONVERSION_TIMEOUT_MS,
      "Pemrosesan foto HEIC/HEIF terlalu lama.",
    );
    const jpegBlob = Array.isArray(converted) ? converted[0] : converted;
    if (!jpegBlob) throw new Error("hasil konversi tidak tersedia");
    return createCompressedFile(file, jpegBlob);
  } catch (error) {
    if (isPhotoProcessingTimeout(error)) {
      throw new Error(
        "Foto HEIC/HEIF terlalu lama diproses. Silakan ambil foto baru dengan kamera langsung.",
      );
    }
    throw new Error(
      "Foto HEIC/HEIF belum dapat dikonversi. Silakan ambil foto baru dengan kamera langsung.",
    );
  }
}

async function normalizeImageOrientation(file: File): Promise<File> {
  const image = await loadImageSource(file);
  try {
    const canvas = renderImageToCanvas(
      image.source,
      image.width,
      image.height,
      MAX_DIMENSION_STEPS[0],
    );
    const blob = await canvasToJpegBlob(canvas, 0.92);
    return blob ? createCompressedFile(file, blob) : file;
  } finally {
    image.cleanup();
  }
}

type LoadedImageSource = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

async function loadImageSource(
  file: File,
  preferLowerMemoryDecoder = false,
): Promise<LoadedImageSource> {
  if (!preferLowerMemoryDecoder && "createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fall through to HTMLImageElement decoding for browsers with partial support.
    }
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  const imageLoaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("browser gagal memuat file foto"));
  });
  image.src = url;

  try {
    if (typeof image.decode === "function") {
      try {
        await withTimeout(
          image.decode(),
          IMAGE_DECODE_TIMEOUT_MS,
          "Pembacaan foto terlalu lama.",
        );
      } catch {
        // Some Android browsers reject Image.decode() even though the native
        // image loader can still finish. The load event is the compatibility
        // fallback before treating the selected photo as unreadable.
        await withTimeout(
          imageLoaded,
          IMAGE_DECODE_TIMEOUT_MS,
          "Pembacaan foto terlalu lama.",
        );
      }
    } else {
      await withTimeout(
        imageLoaded,
        IMAGE_DECODE_TIMEOUT_MS,
        "Pembacaan foto terlalu lama.",
      );
    }
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(
      "Foto tidak dapat dibaca browser. Silakan ambil foto baru dengan kamera langsung.",
    );
  }
  if (!image.naturalWidth || !image.naturalHeight) {
    URL.revokeObjectURL(url);
    throw new Error("Foto tidak valid. Silakan ambil ulang foto.");
  }
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url),
  };
}

function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 1;
  canvas.height = 1;
}

function isDeviceMemoryError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /memory|allocation|out of space|not enough space|bitmap|canvas/i.test(
    message,
  );
}

function isPhotoProcessingTimeout(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /terlalu lama/i.test(message);
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMilliseconds: number,
  timeoutMessage: string,
) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(
      () => reject(new Error(timeoutMessage)),
      timeoutMilliseconds,
    );

    void promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function renderImageToCanvas(
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  maxDimension: number,
) {
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Browser tidak dapat memproses foto.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

function createCompressedFile(source: File, blob: Blob) {
  const baseName = source.name.replace(/\.[^.]+$/, "") || "absensi";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: source.lastModified,
  });
}

function isSupportedImageFile(file: File) {
  if (SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(extension && SUPPORTED_IMAGE_EXTENSIONS.has(extension));
}
