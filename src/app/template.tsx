/**
 * The quiet route transition — one fade-rise on every navigation.
 *
 * Next re-mounts `template.tsx` on each route change (that is the file's
 * one job, and exactly why this is a template and not a layout), so the
 * CSS animation on this wrapper replays once per navigation: opacity
 * 0→1 with an 8px rise, 220ms on --ease, CSS only. No view-transition
 * API, no flags.
 *
 * The hero's own staggered reveal (`.jarl-reveal-*`, 480ms + delays)
 * lives INSIDE this wrapper and runs concurrently, so nothing fires
 * twice — the page surfaces while its hero settles, and total arrival
 * stays around 700ms. The global prefers-reduced-motion kill in
 * globals.css zeroes this animation's duration and delay like every
 * other. The header and footer sit outside, in layout.tsx, and never
 * re-animate.
 */
export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="jarl-route">{children}</div>;
}
