"use client";

import { resolveApiAssetUrl } from "@/lib/config/site";
import { apiClient } from "@/services/api/client";
import { useEffect, useState, type ImgHTMLAttributes } from "react";

function isProtectedUpload(value: string) {
  try {
    const resolved = new URL(resolveApiAssetUrl(value));
    const api = new URL(apiClient.defaults.baseURL ?? window.location.origin);
    return resolved.origin === api.origin && resolved.pathname.startsWith("/uploads/");
  } catch {
    return false;
  }
}

async function createAssetObjectUrl(value: string) {
  const resolved = resolveApiAssetUrl(value);
  if (!isProtectedUpload(resolved)) return { url: resolved, revoke: false };

  const response = await apiClient.get<Blob>(resolved, { responseType: "blob" });
  return { url: URL.createObjectURL(response.data), revoke: true };
}

type ProtectedApiImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

export function ProtectedApiImage({ src, alt, ...props }: ProtectedApiImageProps) {
  const [displaySrc, setDisplaySrc] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    void createAssetObjectUrl(src)
      .then((asset) => {
        if (!active) {
          if (asset.revoke) URL.revokeObjectURL(asset.url);
          return;
        }
        objectUrl = asset.revoke ? asset.url : "";
        setDisplaySrc(asset.url);
      })
      .catch(() => {
        if (active) setDisplaySrc("");
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!displaySrc) return null;

  // The blob URL is created only after the API accepts the bearer token.
  return <img src={displaySrc} alt={alt} {...props} />;
}
