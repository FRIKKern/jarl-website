"use client";

/**
 * Error boundary. Client-only by Next's contract, so it cannot reach the CMS —
 * it uses the chrome fallbacks directly (see src/content/chrome.ts).
 */

import { useEffect } from "react";
import { CHROME_FALLBACK } from "@/content/chrome";
import { Band } from "@/components/Band";
import styles from "./article.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Band surface="ink" space="hero">
      <header className={styles.header}>
        <h1 className={styles.displayTitle}>{CHROME_FALLBACK.errorTitle}</h1>
        <p className={styles.intro}>{CHROME_FALLBACK.errorIntro}</p>
      </header>
      <button type="button" className={styles.button} onClick={reset}>
        {CHROME_FALLBACK.retry}
      </button>
    </Band>
  );
}
