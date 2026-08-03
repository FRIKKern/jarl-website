import type { Metadata } from "next";
import {
  KURIOSITETER,
  ProjectIndex,
  projectIndexMetadata,
} from "@/components/ProjectIndex";

export const revalidate = 60;

/** The own shelf — what I build for my own part. Its twin is /prosjekter;
    both render the same component over the same document type (see
    components/ProjectIndex). Every post here still LIVES at
    /prosjekter/[slug]: the shelf is editorial, the address is not. */
export async function generateMetadata(): Promise<Metadata> {
  return projectIndexMetadata(KURIOSITETER);
}

export default async function KuriositeterPage() {
  return <ProjectIndex shelf={KURIOSITETER} />;
}
