"use client";

import type { ReactNode } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";
import styles from "./Button.module.scss";

export type ButtonVariant = "solid" | "outline" | "icon" | "ghost-icon";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  solid: styles.solid,
  outline: styles.outline,
  icon: styles.icon,
  "ghost-icon": styles.ghostIcon,
};

export type ButtonProps = Omit<AriaButtonProps, "className" | "children"> & {
  variant?: ButtonVariant;
  className?: string;
  children?: ReactNode;
};

export default function Button({
  variant = "solid",
  className,
  ...props
}: ButtonProps) {
  const variantClass = VARIANT_CLASS[variant];
  return (
    <AriaButton
      className={className ? `${variantClass} ${className}` : variantClass}
      {...props}
    />
  );
}
