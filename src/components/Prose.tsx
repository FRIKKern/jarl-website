import styles from "./Prose.module.css";

/** Renders CMS plain-text bodies: blank-line separated paragraphs. */
export function Prose({ text }: { text?: string }) {
  if (!text) return null;
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={styles.prose}>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
