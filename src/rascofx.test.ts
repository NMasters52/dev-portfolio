import { describe, expect, it } from "vitest";
import { getProject, getProjects } from "./lib/content";

describe("RascoFX project slice", () => {
  it("loads the shipped RascoFX record with its verified destinations and evidence", () => {
    expect(getProject("rascofx")).toMatchObject({
      slug: "rascofx",
      title: "RascoFX",
      status: "shipped",
      statusLabel: "Shipped",
      role: "Frontend Developer",
      tags: [
        "React",
        "Vite",
        "Tailwind CSS",
        "React Router DOM",
        "Formspree",
        "Vercel",
        "Cloudinary",
        "React Icons",
        "fireworks-js",
        "QRCode React",
      ],
      repositoryUrl: "https://github.com/NMasters52/fireworks",
      liveUrl: "https://rascofx.com",
      isLive: true,
      updatedAt: "2026-06-05",
      formattedUpdatedAt: "June 5, 2026",
      image: {
        src: "../images/rascofx-product-detail-bowser-24pk.jpg",
        alt: "RascoFX Bowser 24pk product detail showing its demonstration video, product image, and category.",
      },
      relatedWritings: [],
    });

    const project = getProject("rascofx");
    expect(project.bodyHtml).toContain("<h2>What it does</h2>");
    expect(project.bodyHtml).toContain("30-plus products");
    expect(getProjects().map(({ slug }) => slug)).toEqual([
      "disc-golf-labs",
      "rascofx",
      "bill-buddy",
      "github-finder",
    ]);
  });
});
