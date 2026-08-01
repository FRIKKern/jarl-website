/**
 * The art-directed crop field, parsed.
 *
 * `ProjectImage.focus` is authored in the CMS as either a raw CSS
 * object-position value ("50% 30%", "20% center") or a named anchor in
 * Norwegian, matching how an editor talks about a picture: `topp`,
 * `senter`, `bunn`, `venstre`, `høyre` (ASCII `hoyre` accepted too).
 *
 * TOLERANT BY LAW: this value crosses the CMS boundary, so a typo must
 * degrade to the default center-crop — `undefined` here means "say nothing",
 * and the renderer's `object-fit: cover` keeps its own center. Nothing
 * unvalidated is ever echoed into a style attribute.
 */

const NAMED: Record<string, string> = {
  /* vertical anchors — a touch inside the true edge, so a subject at the
     rim keeps its margin instead of kissing the crop */
  topp: "50% 12%",
  senter: "50% 50%",
  bunn: "50% 88%",
  /* horizontal anchors — hard to the edge: these exist for captures whose
     content is left- or right-anchored (terminals, split layouts), where
     the honest crop starts at the content's own margin */
  venstre: "0% 50%",
  hoyre: "100% 50%",
  ["høyre"]: "100% 50%",
};

/** One object-position component: a percentage, a px length, or a keyword. */
const COMPONENT = /^(-?\d+(?:\.\d+)?(?:%|px)|left|center|right|top|bottom)$/;

/**
 * Parse an authored focus into a safe `object-position` value, or
 * `undefined` when absent or unparseable (→ the CSS default, center).
 */
export function focusPosition(focus?: string): string | undefined {
  if (!focus) return undefined;
  const raw = focus.trim().toLowerCase();
  if (raw in NAMED) return NAMED[raw];
  const parts = raw.split(/\s+/);
  if (parts.length < 1 || parts.length > 2) return undefined;
  if (!parts.every((p) => COMPONENT.test(p))) return undefined;
  return parts.join(" ");
}
