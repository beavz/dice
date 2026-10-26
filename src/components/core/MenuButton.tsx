"use client";

import type { ReactNode } from "react";
import { Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";
import Button, { type ButtonVariant } from "./Button";
import styles from "./MenuButton.module.scss";

export type MenuButtonItem<T extends string> = {
  id: T;
  label: ReactNode;
};

type MenuButtonProps<T extends string> = {
  label: ReactNode;
  items: MenuButtonItem<T>[];
  onAction: (id: T) => void;
  variant?: ButtonVariant;
};

export default function MenuButton<T extends string>({
  label,
  items,
  onAction,
  variant,
}: MenuButtonProps<T>) {
  return (
    <MenuTrigger>
      <Button variant={variant}>{label}</Button>
      <Popover className={styles.popover}>
        <Menu
          onAction={(key) => onAction(key as T)}
          className={styles.list}
        >
          {items.map((item) => (
            <MenuItem key={item.id} id={item.id} className={styles.item}>
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
