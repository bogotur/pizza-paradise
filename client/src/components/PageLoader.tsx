import React from "react";
import styles from "../styles/PageLoader.module.css";

type Props = {
  open: boolean;
  text?: string;
  subtext?: string;
  progress?: number;
};

const clamp = (v: number) => Math.max(0, Math.min(100, v));

const PageLoader: React.FC<Props> = ({ open, text, subtext, progress }) => {
  if (!open) return null;

  const hasProgress = typeof progress === "number";
  const p = hasProgress ? clamp(progress as number) : 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.top}>
          <div className={styles.spinner} />
          <div className={styles.titles}>
            <div className={styles.text}>{text || "Зачекайте..."}</div>
            {subtext ? <div className={styles.subtext}>{subtext}</div> : null}
          </div>

          {hasProgress ? <div className={styles.percent}>{p}%</div> : null}
        </div>

        {hasProgress ? (
          <div className={styles.barWrap}>
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: `${p}%` }} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PageLoader;