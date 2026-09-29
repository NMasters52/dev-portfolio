import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Project, Writing } from "../lib/content";

type WorkView = "projects" | "writings";

interface Props {
  projects: Project[];
  writings: Writing[];
}

const views: WorkView[] = ["projects", "writings"];

export default function ConnectedWork({ projects, writings }: Props) {
  const [activeView, setActiveView] = useState<WorkView>("projects");
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollPositions = useRef<Record<WorkView, number>>({ projects: 0, writings: 0 });
  const panel = useRef<HTMLDivElement>(null);
  const tabs = useRef<Record<WorkView, HTMLButtonElement | null>>({ projects: null, writings: null });

  function updateActiveCard() {
    const currentPanel = panel.current;
    if (!currentPanel) return;
    const cards = Array.from(currentPanel.querySelectorAll<HTMLElement>(".card"));
    const panelBounds = currentPanel.getBoundingClientRect();
    const endPadding = parseFloat(getComputedStyle(currentPanel).paddingRight) || 0;
    const lastCard = cards.at(-1);
    setCanScrollRight(Boolean(lastCard && lastCard.getBoundingClientRect().right > panelBounds.right - endPadding + 2));
    const panelLeft = panelBounds.left;
    const nextIndex = cards.reduce((closestIndex, card, index) => {
      const closestCard = cards[closestIndex];
      return Math.abs(card.getBoundingClientRect().left - panelLeft)
        < Math.abs(closestCard.getBoundingClientRect().left - panelLeft)
        ? index
        : closestIndex;
    }, 0);
    setActiveCardIndex(nextIndex);
  }

  function scrollToCard(index: number) {
    const currentPanel = panel.current;
    const cards = currentPanel?.querySelectorAll<HTMLElement>(".card");
    const card = cards?.[index];
    if (!currentPanel || !card) return;
    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: index === cards.length - 1 ? "end" : "start",
    });
    setActiveCardIndex(index);
  }

  useEffect(() => {
    requestAnimationFrame(updateActiveCard);
  }, [activeView]);

  function selectView(view: WorkView, moveFocus = false) {
    if (view === activeView) return;
    if (panel.current) scrollPositions.current[activeView] = panel.current.scrollLeft;
    setActiveView(view);
    requestAnimationFrame(() => {
      if (panel.current) panel.current.scrollLeft = scrollPositions.current[view];
      updateActiveCard();
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

      <div className="work-scroll-hint">
        <div className="work-pagination" role="group" aria-label={`${activeView === "projects" ? "Projects" : "Writings"} carousel`}>
          {Array.from({ length: activeView === "projects" ? projects.length : writings.length }, (_, index) => (
            <button
              aria-current={activeCardIndex === index ? "true" : undefined}
              aria-label={`Show ${activeView === "projects" ? "project" : "writing"} ${index + 1}`}
              className="work-pagination-pill"
              key={index}
              onClick={() => scrollToCard(index)}
              type="button"
            />
          ))}
        </div>
      </div>
      <div className={`work-panel-wrap${canScrollRight ? " has-more" : ""}`}>
        <div
          aria-labelledby={`${activeView}-tab`}
          className="work-panel"
          id="connected-work-panel"
          onScroll={updateActiveCard}
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
        <div className="work-scroll-edge" aria-hidden="true" />
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const visibleTags = project.tags.slice(0, 3);
  const remainingTags = project.tags.length - visibleTags.length;

  return (
    <article className="card">
      <p className="card-record"><span>{project.statusLabel}</span></p>
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
      {project.relatedWritings.length > 0 && <div className="card-footer">
        <div className="related">
          <span>{project.relatedWritings.length === 1 ? "Related Writing" : "Related Writings"}</span>
          {project.relatedWritings.map((writing) => (
            <a href={`/writings/${writing.slug}/`} key={writing.slug}>{writing.title}</a>
          ))}
        </div>
      </div>}
    </article>
  );
}

function WritingCard({ writing, projects }: { writing: Writing; projects: Project[] }) {
  const relatedProjects = writing.relatedProjects.map((slug) => projects.find((project) => project.slug === slug)!);

  return (
    <article className="card">
      <p className="card-record"><span>Writing</span><span>Connected note</span></p>
      <h3><a href={`/writings/${writing.slug}/`}>{writing.title}</a></h3>
      <p>{writing.summary}</p>
      <ul className="tags" aria-label="Topics">{writing.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
      <div className="links"><a href={`/writings/${writing.slug}/`}>Read writing</a></div>
      <div className="card-footer">
        <div className="related">
          <span>{relatedProjects.length === 1 ? "Related Project" : "Related Projects"}</span>
          {relatedProjects.map((project) => (
            <a href={`/projects/${project.slug}/`} key={project.slug}>{project.title}</a>
          ))}
        </div>
        <p className="card-support">Published {writing.formattedPublishedAt} · {writing.readingTimeMinutes} min read</p>
      </div>
    </article>
  );
}
