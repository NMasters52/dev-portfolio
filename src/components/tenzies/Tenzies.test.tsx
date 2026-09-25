// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import Tenzies from "./Tenzies";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("keeps held dice through rolls, wins only when all are held, and resets", async () => {
  const user = userEvent.setup();
  const random = vi.spyOn(Math, "random").mockReturnValue(0);
  render(<Tenzies />);
  const dice = screen.getAllByRole("button", { name: /^Die / });
  dice[0].focus();
  await user.keyboard(" ");
  expect(dice[0]).toHaveAttribute("aria-pressed", "true");
  random.mockReturnValue(.9);
  await user.click(screen.getByRole("button", { name: "Roll dice" }));
  expect(dice[0]).toHaveAccessibleName("Die 1, value 1");
  expect(dice[1]).toHaveAccessibleName("Die 2, value 6");
  random.mockReturnValue(0);
  await user.click(screen.getByRole("button", { name: "Roll dice" }));
  expect(screen.queryByRole("button", { name: "New Game" })).not.toBeInTheDocument();
  for (const die of dice.slice(1)) await user.click(die);
  expect(screen.getByRole("status")).toHaveTextContent("Tenzies! It took you 2 rolls!");
  await user.click(screen.getByRole("button", { name: "New Game" }));
  expect(screen.getByRole("status")).toHaveTextContent("0 rolls · 0 of 10 held");
  expect(dice[0]).toHaveAttribute("aria-pressed", "false");
});

it("lets a player release a held die", async () => {
  const user = userEvent.setup();
  render(<Tenzies />);
  const die = screen.getAllByRole("button", { name: /^Die / })[0];
  await user.click(die);
  await user.click(die);
  expect(die).toHaveAttribute("aria-pressed", "false");
});
