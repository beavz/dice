"use client";

import {
  forwardRef,
  type KeyboardEventHandler,
  type FocusEventHandler,
} from "react";
import {
  FieldError,
  Input,
  Label,
  TextField as AriaTextField,
} from "react-aria-components";
import styles from "./TextField.module.scss";

export type TextFieldProps = {
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  className?: string;
};

function TextField(
  {
    label,
    ariaLabel,
    placeholder,
    value,
    error,
    onChange,
    onBlur,
    onKeyDown,
    className,
  }: TextFieldProps,
  ref: React.Ref<HTMLInputElement>,
) {
  return (
    <AriaTextField
      className={className ?? styles.row}
      aria-label={label ? undefined : ariaLabel}
      value={value}
      isInvalid={!!error}
      onChange={onChange}
    >
      {label && <Label className={styles.label}>{label}</Label>}
      <Input
        ref={ref}
        placeholder={placeholder}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={styles.input}
      />
      <FieldError className={styles.error}>{error}</FieldError>
    </AriaTextField>
  );
}

export default forwardRef(TextField);
