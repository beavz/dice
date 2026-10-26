"use client";

import type { ReactNode } from "react";
import Button from "@/components/core/Button";
import CloseIcon from "@/components/icons/CloseIcon";
import styles from "./Node.module.scss";

type NodeProps = {
  label: string;
  onRemove?: () => void;
  children: ReactNode;
};

export function Node({ label, onRemove, children }: NodeProps) {
  return (
    <fieldset className={styles.stepContent}>
      <legend className={styles.stepLabel}>{label}</legend>
      {onRemove && (
        <div className={styles.stepContentHeader}>
          <Button
            variant="ghost-icon"
            onPress={onRemove}
            aria-label="Remove step"
          >
            <CloseIcon />
          </Button>
        </div>
      )}
      {children}
    </fieldset>
  );
}
