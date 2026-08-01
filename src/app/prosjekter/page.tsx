import type { Metadata } from "next";
import { getNavigation, getProjects, getSiteSettings } from "@/content/loaders";
import { Band } from "@/components/Band";
import { ProjectCard } from "@/components/ProjectCard";
import { routeMetadata } from "@/lib/metadata";
import styles from "../article.module.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [navItems, settings] = await Promise.all([
    getNavigation(),
    getSiteSettings(),
  ]);
  return routeMetadata({
    title: navItems.find((i) => i.href === "/prosjekter")?.label,
    /* an index page has no CMS description of its own; the site tagline is
       the closest true statement about it */
    description: settings?.tagline,
    path: "/prosjekter",
    siteName: settings?.title,
  });
}

export default async function ProsjekterPage() {
  const [navItems, projects, settings] = await Promise.all([
    getNavigation(),
    getProjects(),
    getSiteSettings(),
  ]);
  const nav = navItems.find((i) => i.href === "/prosjekter");

  return (
    <>
      <Band surface="paper" rule space="tight">
        <header className={styles.header}>
          <h1 className={`${styles.displayTitle} jarl-reveal-1`}>
            {nav?.label}
          </h1>
          {settings?.tagline ? (
            <p className={`${styles.intro} jarl-reveal-2`}>{settings.tagline}</p>
          ) : null}
        </header>
      </Band>
      <Band surface="paper" rule>
        <div className={styles.grid}>
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} headingLevel={2} />
          ))}
        </div>
      </Band>
    </>
  );
}
