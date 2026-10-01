"use client";

import {
  Button,
  Group,
  Input,
  Label,
  NumberField as AriaNumberField,
} from "react-aria-components";
import styles from "./NumberField.module.scss";

export type NumberFieldProps = {
  label?: string;
  ariaLabel?: string;
  value: number;
  minValue?: number;
  maxValue?: number;
  isDisabled?: boolean;
  onChange: (value: number) => void;
};

export default function NumberField({
  label,
  ariaLabel,
  value,
  minValue,
  maxValue,
  isDisabled,
  onChange,
}: NumberFieldProps) {
  return (
    <AriaNumberField
      aria-label={label ? undefined : ariaLabel}
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      isDisabled={isDisabled}
      onChange={onChange}
      className={styles.field}
    >
      {label && <Label className={styles.label}>{label}</Label>}
      <Group className={styles.group}>
        <Button className={styles.button} slot="decrement">
          −
        </Button>
        <Input className={styles.input} />
        <Button className={styles.button} slot="increment">
          +
        </Button>
      </Group>
    </AriaNumberField>
  );
}
