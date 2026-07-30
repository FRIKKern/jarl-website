import type { Metadata } from "next";
import { getNavigation, getProjects } from "@/content/loaders";
import { ProjectCard } from "@/components/ProjectCard";
import styles from "../article.module.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const navItems = await getNavigation();
  return { title: navItems.find((i) => i.href === "/prosjekter")?.label };
}

export default async function ProsjekterPage() {
  const [navItems, projects] = await Promise.all([
    getNavigation(),
    getProjects(),
  ]);
  const nav = navItems.find((i) => i.href === "/prosjekter");

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>{nav?.label}</h1>
      </header>
      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>
    </div>
  );
}
