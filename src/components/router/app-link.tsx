import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Link } from "react-router-dom";
import { preloadRoute } from "@/lib/route-preload";

type AppLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "to"> & {
  href: string;
};

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  ({ href, onFocus, onPointerEnter, onTouchStart, ...props }, ref) => (
    <Link
      ref={ref}
      to={href}
      onFocus={(event) => {
        void preloadRoute(href);
        onFocus?.(event);
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") void preloadRoute(href);
        onPointerEnter?.(event);
      }}
      onTouchStart={(event) => {
        void preloadRoute(href);
        onTouchStart?.(event);
      }}
      {...props}
    />
  ),
);

AppLink.displayName = "AppLink";
