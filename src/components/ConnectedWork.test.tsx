// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { getProjects, getWritings } from "../lib/content";
import ConnectedWork from "./ConnectedWork";

afterEach(cleanup);

function renderConnectedWork() {
  return render(<ConnectedWork projects={getProjects()} writings={getWritings()} />);
}

describe("Connected Work route behavior", () => {
  it("opens on Projects with the truthful project actions and relationship", () => {
    renderConnectedWork();

    expect(screen.getByRole("tab", { name: /Projects/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Disc Golf Labs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Project Details" })).toHaveAttribute(
      "href",
      "/projects/disc-golf-labs/",
    );
    expect(screen.getByRole("link", { name: "Source Code" })).toHaveAttribute(
      "href",
      "https://github.com/NMasters52/DiscGolfLabs-Frontend",
    );
    expect(screen.queryByRole("link", { name: "Live Site" })).not.toBeInTheDocument();
    expect(screen.getByText("Related Writing").nextElementSibling).toHaveAttribute(
      "href",
      "/writings/small-models-strong-guardrails/",
    );
  });

  it("switches tabs with conventional keys and renders the writing destinations", async () => {
    const user = userEvent.setup();
    renderConnectedWork();
    const projectsTab = screen.getByRole("tab", { name: /Projects/ });
    projectsTab.focus();

    await user.keyboard("{ArrowRight}");

    const writingsTab = screen.getByRole("tab", { name: /Writings/ });
    expect(writingsTab).toHaveFocus();
    expect(writingsTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/August 14, 2026 · \d+ min read/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read writing" })).toHaveAttribute(
      "href",
      "/writings/small-models-strong-guardrails/",
    );
    expect(screen.getByText("Related Project").nextElementSibling).toHaveAttribute(
      "href",
      "/projects/disc-golf-labs/",
    );

    await user.keyboard("{Home}");
    expect(projectsTab).toHaveFocus();
    await user.keyboard("{End}");
    expect(writingsTab).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(projectsTab).toHaveFocus();
  });

  it("restores each tab panel scroll position", async () => {
    renderConnectedWork();
    const panel = screen.getByRole("tabpanel");
    panel.scrollTop = 240;

    fireEvent.click(screen.getByRole("tab", { name: /Writings/ }));
    await waitFor(() => expect(panel.scrollTop).toBe(0));
    panel.scrollTop = 90;

    fireEvent.click(screen.getByRole("tab", { name: /Projects/ }));
    await waitFor(() => expect(panel.scrollTop).toBe(240));
    fireEvent.click(screen.getByRole("tab", { name: /Writings/ }));
    await waitFor(() => expect(panel.scrollTop).toBe(90));
  });
});
