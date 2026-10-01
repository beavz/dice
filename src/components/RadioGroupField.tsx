"use client";

import {
  Label,
  Radio,
  RadioGroup as AriaRadioGroup,
} from "react-aria-components";
import styles from "./RadioGroupField.module.scss";

export type RadioGroupFieldOption<T extends string> = {
  value: T;
  label: string;
};

export type RadioGroupFieldProps<T extends string> = {
  label: string;
  value: T;
  options: RadioGroupFieldOption<T>[];
  onChange: (value: T) => void;
};

export default function RadioGroupField<T extends string>({
  label,
  value,
  options,
  onChange,
}: RadioGroupFieldProps<T>) {
  return (
    <AriaRadioGroup
      value={value}
      onChange={(next) => onChange(next as T)}
      orientation="horizontal"
      className={styles.group}
    >
      <Label className={styles.label}>{label}</Label>
      <div className={styles.row}>
        {options.map((option) => (
          <Radio
            key={option.value}
            value={option.value}
            className={styles.radio}
          >
            {option.label}
          </Radio>
        ))}
      </div>
    </AriaRadioGroup>
  );
}
