import type { ReactNode } from "react";
import styles from "./PageSection.module.scss";

type PageSectionProps = {
  heading: ReactNode;
  icons?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PageSection({
  heading,
  icons,
  actions,
  children,
}: PageSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>
          {icons}
          {heading}
        </h2>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {children}
    </section>
  );
}
