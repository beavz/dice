import type { ReactNode } from "react";
import styles from "./Card.module.scss";

type CardProps = {
  title?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function Card({ title, className, children }: CardProps) {
  return (
    <div className={className ? `${styles.card} ${className}` : styles.card}>
      {title && <h3 className={styles.title}>{title}</h3>}
      {children}
    </div>
  );
}
