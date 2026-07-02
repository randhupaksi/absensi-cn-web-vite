import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Link } from "react-router-dom";

type AppLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "to"> & {
  href: string;
};

export const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(
  ({ href, ...props }, ref) => <Link ref={ref} to={href} {...props} />,
);

AppLink.displayName = "AppLink";
