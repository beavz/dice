"use client";

import {
  Button as AriaButton,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
} from "react-aria-components";
import styles from "./SelectField.module.scss";

export type SelectFieldOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectFieldOption<T>[];
};

export default function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: SelectFieldProps<T>) {
  return (
    <AriaSelect
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as T)}
      className={styles.select}
    >
      <Label className={styles.label}>{label}</Label>
      <AriaButton className={styles.button}>
        <SelectValue>
          {({ selectedText }) => (
            <span className={styles.value}>{selectedText}</span>
          )}
        </SelectValue>
        <span aria-hidden="true">▾</span>
      </AriaButton>
      <Popover className={styles.popover}>
        <ListBox className={styles.list}>
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              className={styles.item}
            >
              {option.description ? (
                <>
                  <span className={styles.optionLabel}>{option.label}</span>
                  <span className={styles.optionDescription}>
                    {option.description}
                  </span>
                </>
              ) : (
                option.label
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
