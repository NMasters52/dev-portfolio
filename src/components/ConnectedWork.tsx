import { useRef, useState, type KeyboardEvent } from "react";
import type { Project, Writing } from "../lib/content";

type WorkView = "projects" | "writings";

interface Props {
  projects: Project[];
  writings: Writing[];
}

const views: WorkView[] = ["projects", "writings"];

export default function ConnectedWork({ projects, writings }: Props) {
  const [activeView, setActiveView] = useState<WorkView>("projects");
  const scrollPositions = useRef<Record<WorkView, number>>({ projects: 0, writings: 0 });
  const panel = useRef<HTMLDivElement>(null);
  const tabs = useRef<Record<WorkView, HTMLButtonElement | null>>({ projects: null, writings: null });

  function selectView(view: WorkView, moveFocus = false) {
    if (view === activeView) return;
    if (panel.current) scrollPositions.current[activeView] = panel.current.scrollTop;
    setActiveView(view);
    requestAnimationFrame(() => {
      if (panel.current) panel.current.scrollTop = scrollPositions.current[view];
      if (moveFocus) tabs.current[view]?.focus();
    });
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, view: WorkView) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = views.indexOf(view);
    const nextView = event.key === "Home"
      ? views[0]
      : event.key === "End"
        ? views.at(-1)!
        : views[(index + (event.key === "ArrowRight" ? 1 : -1) + views.length) % views.length];
    selectView(nextView, true);
  }

  return (
    <div className="work-shell">
      <div className="work-tabs" role="tablist" aria-label="Connected Work views">
        {views.map((view) => {
          const active = activeView === view;
          const count = view === "projects" ? projects.length : writings.length;
          const label = view === "projects" ? "Projects" : "Writings";
          return (
            <button
              aria-controls="connected-work-panel"
              aria-selected={active}
              className="work-tab"
              id={`${view}-tab`}
              key={view}
              onClick={() => selectView(view)}
              onKeyDown={(event) => handleTabKeyDown(event, view)}
              ref={(element) => { tabs.current[view] = element; }}
              role="tab"
              tabIndex={active ? 0 : -1}
              type="button"
            >
              {label} <span aria-label={`${count} ${label.toLowerCase()}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby={`${activeView}-tab`}
        className="work-panel"
        id="connected-work-panel"
        ref={panel}
        role="tabpanel"
        tabIndex={0}
      >
        <div className="card-grid">
          {activeView === "projects"
            ? projects.map((project) => <ProjectCard key={project.slug} project={project} />)
            : writings.map((writing) => (
              <WritingCard key={writing.slug} projects={projects} writing={writing} />
            ))}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const visibleTags = project.tags.slice(0, 3);
  const remainingTags = project.tags.length - visibleTags.length;

  return (
    <article className="card">
      <p className="card-record"><span>{project.statusLabel}</span><span>Last updated {project.formattedUpdatedAt}</span></p>
      <h3><a href={`/projects/${project.slug}/`}>{project.title}</a></h3>
      <p>{project.summary}</p>
      <ul className="tags" aria-label="Technologies">
        {visibleTags.map((tag) => <li key={tag}>{tag}</li>)}
        {remainingTags > 0 && <li aria-label={`${remainingTags} more technologies`}>+{remainingTags}</li>}
      </ul>
      <div className="links">
        <a href={`/projects/${project.slug}/`}>Project Details</a>
        <a href={project.repositoryUrl}>Source Code</a>
        {project.liveUrl && <a href={project.liveUrl}>Live Site</a>}
      </div>
      {project.relatedWritings.length > 0 && (
        <div className="related">
          <span>{project.relatedWritings.length === 1 ? "Related Writing" : "Related Writings"}</span>
          {project.relatedWritings.map((writing) => (
            <a href={`/writings/${writing.slug}/`} key={writing.slug}>{writing.title}</a>
          ))}
        </div>
      )}
    </article>
  );
}

function WritingCard({ writing, projects }: { writing: Writing; projects: Project[] }) {
  const relatedProjects = writing.relatedProjects.map((slug) => projects.find((project) => project.slug === slug)!);

  return (
    <article className="card">
      <p className="card-record"><span>Writing</span><span>{writing.formattedPublishedAt} · {writing.readingTimeMinutes} min read</span></p>
      <h3><a href={`/writings/${writing.slug}/`}>{writing.title}</a></h3>
      <p>{writing.summary}</p>
      <ul className="tags" aria-label="Topics">{writing.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
      <div className="links"><a href={`/writings/${writing.slug}/`}>Read writing</a></div>
      <div className="related">
        <span>{relatedProjects.length === 1 ? "Related Project" : "Related Projects"}</span>
        {relatedProjects.map((project) => (
          <a href={`/projects/${project.slug}/`} key={project.slug}>{project.title}</a>
        ))}
      </div>
    </article>
  );
}
