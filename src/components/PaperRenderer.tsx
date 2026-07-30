import type { JSX } from "react";
import type {
  CalloutBlock,
  HeadingBlock,
  ListBlock,
  PaperBlock,
  PaperInline,
  TableBlock,
} from "@/content/types";
import styles from "./PaperRenderer.module.css";

/**
 * Bulldocs block renderer.
 *
 * MECHANICAL SPACING LAW:
 *  - the renderer adds NO vertical margins between blocks;
 *  - an empty paragraph block renders as exactly ONE literal blank row,
 *    never collapsed, never merged with a neighbour.
 * All whitespace on a paper page is authored in the document itself.
 */

function inlineText(item: PaperInline): string {
  if (typeof item === "string") return item;
  return (item.value as string) ?? (item as { text?: string }).text ?? "";
}

function Inline({ content }: { content?: PaperInline[] }) {
  if (!content?.length) return null;
  return (
    <>
      {content.map((item, i) => {
        if (typeof item !== "string" && item.type === "link") {
          const href = (item as { href?: string }).href;
          const label = inlineText(item) || href || "";
          return href ? (
            <a key={i} href={href}>
              {label}
            </a>
          ) : (
            <span key={i}>{label}</span>
          );
        }
        return <span key={i}>{inlineText(item)}</span>;
      })}
    </>
  );
}

function isEmptyParagraph(block: PaperBlock): boolean {
  if (block.type !== "paragraph") return false;
  const content = (block as { content?: PaperInline[] }).content;
  if (!content || content.length === 0) return true;
  return content.every((item) => inlineText(item).trim() === "");
}

function Heading({ block }: { block: HeadingBlock }) {
  const level = Math.min(Math.max(block.level ?? 2, 1), 4);
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return (
    <Tag className={styles[`h${level}`]}>
      <Inline content={block.content} />
    </Tag>
  );
}

function List({ block }: { block: ListBlock }) {
  const Tag = block.ordered ? "ol" : "ul";
  return (
    <Tag className={styles.list}>
      {(block.items ?? []).map((item, i) => (
        <li key={i}>
          <Inline content={item} />
        </li>
      ))}
    </Tag>
  );
}

function Table({ block }: { block: TableBlock }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        {block.head?.length ? (
          <thead>
            <tr>
              {block.head.map((cell, i) => (
                <th key={i}>{cell}</th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {(block.rows ?? []).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ block }: { block: CalloutBlock }) {
  return (
    <aside className={styles.callout} data-tone={block.tone ?? "info"}>
      {block.title ? <p className={styles.calloutTitle}>{block.title}</p> : null}
      {typeof block.text === "string" ? (
        <p>{block.text}</p>
      ) : (
        <p>
          <Inline content={block.text} />
        </p>
      )}
    </aside>
  );
}

function Block({ block }: { block: PaperBlock }) {
  if (isEmptyParagraph(block)) {
    /* one literal blank row — the mechanical spacing law */
    return <div className={styles.blank} aria-hidden="true" />;
  }
  switch (block.type) {
    case "paragraph":
      return (
        <p className={styles.paragraph}>
          <Inline content={(block as { content?: PaperInline[] }).content} />
        </p>
      );
    case "heading":
      return <Heading block={block as HeadingBlock} />;
    case "list":
      return <List block={block as ListBlock} />;
    case "table":
      return <Table block={block as TableBlock} />;
    case "callout":
      return <Callout block={block as CalloutBlock} />;
    case "eyebrow":
      return (
        <p className={styles.eyebrow}>{(block as { text?: string }).text}</p>
      );
    case "ingress":
      return (
        <p className={styles.ingress}>
          <Inline content={(block as { content?: PaperInline[] }).content} />
        </p>
      );
    case "divider":
      return <hr className={styles.divider} />;
    default:
      /* unsupported block types render nothing — never invented spacing */
      return null;
  }
}

export function PaperRenderer({ blocks }: { blocks?: PaperBlock[] }) {
  if (!blocks?.length) return null;
  return (
    <div className={styles.paper}>
      {blocks.map((block, i) => (
        <Block key={(block as { id?: string }).id ?? i} block={block} />
      ))}
    </div>
  );
}
