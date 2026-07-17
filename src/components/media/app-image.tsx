import { forwardRef, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AppImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

export const AppImage = forwardRef<HTMLImageElement, AppImageProps>(
  ({ fill, priority, unoptimized: _unoptimized, className, loading, decoding, fetchPriority, ...props }, ref) => (
    <img
      ref={ref}
      className={cn(fill && "absolute inset-0 size-full", className)}
      loading={priority ? "eager" : loading ?? "lazy"}
      decoding={decoding ?? "async"}
      fetchPriority={priority ? "high" : fetchPriority}
      {...props}
    />
  ),
);

AppImage.displayName = "AppImage";
