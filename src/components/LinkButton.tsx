"use client";

import Button, { ButtonProps } from "@mui/material/Button";
import IconButton, { IconButtonProps } from "@mui/material/IconButton";
import Link from "next/link";

/**
 * A Button component that works with Next.js Link wrapper for navigation.
 */
interface LinkButtonProps extends Omit<ButtonProps, "href"> {
  href: string;
  target?: string;
  rel?: string;
}

export function LinkButton({ href, target, rel, children, ...props }: LinkButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel || (target === "_blank" ? "noopener noreferrer" : undefined)}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Button {...props}>{children}</Button>
    </Link>
  );
}

/**
 * An IconButton component that works with Next.js Link wrapper for navigation.
 */
interface LinkIconButtonProps extends Omit<IconButtonProps, "href"> {
  href: string;
  target?: string;
  rel?: string;
}

export function LinkIconButton({ href, target, rel, children, ...props }: LinkIconButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel || (target === "_blank" ? "noopener noreferrer" : undefined)}
      style={{ textDecoration: "none", color: "inherit", display: "inline-flex" }}
    >
      <IconButton {...props}>{children}</IconButton>
    </Link>
  );
}
