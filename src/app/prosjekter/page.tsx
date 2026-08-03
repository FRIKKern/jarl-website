import type { Metadata } from "next";
import {
  PROSJEKTER,
  ProjectIndex,
  projectIndexMetadata,
} from "@/components/ProjectIndex";

export const revalidate = 60;

/** The client shelf — the work done for someone else. Its twin is
    /kuriositeter; both render the same component over the same document
    type (see components/ProjectIndex). */
export async function generateMetadata(): Promise<Metadata> {
  return projectIndexMetadata(PROSJEKTER);
}

export default async function ProsjekterPage() {
  return <ProjectIndex shelf={PROSJEKTER} />;
}
