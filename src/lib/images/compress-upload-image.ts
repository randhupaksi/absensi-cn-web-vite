// Most attendance photos should land around 150–200 KB. The backend accepts a
// small tolerance up to 300 KB so a usable photo is never discarded merely
// because a device produces a more detailed image.
const TARGET_IMAGE_BYTES = 200 * 1024;
const MAX_UPLOAD_IMAGE_BYTES = 300 * 1024;
const MAX_DIMENSION_STEPS = [960, 800, 720, 640, 560, 480, 400, 360, 320, 256] as const;
const JPEG_QUALITY_STEPS = [0.76, 0.7, 0.64, 0.58, 0.52, 0.46, 0.4, 0.34] as const;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SUPPORTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export async function compressUploadImage(file: File): Promise<File> {
  if (!isSupportedImageFile(file)) {
    throw new Error("Format foto harus JPG, PNG, atau WEBP.");
  }

  if (file.size <= TARGET_IMAGE_BYTES) {
    const normalizedFile = await normalizeImageOrientation(file);
    if (normalizedFile.size <= MAX_UPLOAD_IMAGE_BYTES) {
      return normalizedFile;
    }
    return compressUploadImage(normalizedFile);
  }

  const image = await loadImageSource(file);
  try {
    let bestBlob: Blob | null = null;

    for (const maxDimension of MAX_DIMENSION_STEPS) {
      const canvas = renderImageToCanvas(image.source, image.width, image.height, maxDimension);
      for (const quality of JPEG_QUALITY_STEPS) {
        const blob = await canvasToJpegBlob(canvas, quality);
        if (!blob) continue;
        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
        }
        if (blob.size <= TARGET_IMAGE_BYTES) {
          return createCompressedFile(file, blob);
        }
      }
    }

    if (bestBlob && bestBlob.size <= MAX_UPLOAD_IMAGE_BYTES) {
      return createCompressedFile(file, bestBlob);
    }

    if (file.size <= MAX_UPLOAD_IMAGE_BYTES) {
      return file;
    }

    throw new Error("Foto tidak dapat dikompres hingga batas 300 KB. Silakan ambil ulang foto dengan pencahayaan yang lebih baik.");
  } finally {
    image.cleanup();
  }
}

async function normalizeImageOrientation(file: File): Promise<File> {
  const image = await loadImageSource(file);
  try {
    const canvas = renderImageToCanvas(image.source, image.width, image.height, MAX_DIMENSION_STEPS[0]);
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

async function loadImageSource(file: File): Promise<LoadedImageSource> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
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
  image.src = url;
  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Format foto tidak dapat dibaca browser. Gunakan foto JPG atau PNG.");
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
