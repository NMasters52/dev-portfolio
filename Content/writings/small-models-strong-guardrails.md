---
title: Small Models, Strong Guardrails
summary: How repository constraints make smaller coding models useful without outsourcing engineering judgment.
publishedAt: 2026-08-14
tags:
  - AI
  - Agents
  - Workflow
relatedProjects:
  - disc-golf-labs
---

## The claim

Small coding models are useful exactly to the degree your repository can judge them. A frontier model can hold an architecture in its head and mostly stay honest; a smaller one cannot. But most of what we call coding is not architecture. It is bounded changes against a codebase that already knows more than the model does.

If the repository can type-check, test, and lint the result, the model's job shrinks to **proposing a diff that survives those gates**. That is a job a small model can do cheaply, on every commit, without being trusted.

## Where small models fall apart

The failure modes are consistent, and none of them are intelligence problems. They are judgment problems, the exact thing a repository is good at supplying:

- **Context drift**: long sessions wander from the stated task into drive-by edits.
- **Confident API misuse**: invented props and endpoints look plausible and compile wrong.
- **Diff scope creep**: fixes grow tails through formatting, renames, and unrequested refactors.
- **Verification theater**: prose explains why the change works instead of running it.

## Guardrails that hold

Four constraints cover nearly all of it. Each is a fact about the repository, not an instruction to the model.

1. **Typed boundaries.** Strict TypeScript, no `any` escapes in CI, and schemas at the edges. Wrong API use should be a compile error, not a review comment.
2. **Tests as the arbiter.** The model sees failing tests first and passing tests as its stop condition. Explanations do not count as evidence.
3. **Small task shaping.** One behavior per session. If the diff cannot be read in a minute, the task was too big.
4. **Gates, not vibes.** Types, lint, and tests run on every agent diff before a human reads a line.

> The model proposes; the repository disposes.

## Running it in Disc Golf Labs

This is where the note pays rent. Disc Golf Labs runs on a small-model loop: each agent session is scoped to one feature area, starts from a failing test, and ends at a green run. The scaffold prompt is four lines. Everything else the model needs to know, the repository already says through its types and tests.

The result is boring diffs, and boring is the point. Review became skimming for intent instead of hunting for hallucinations.

## What still goes to bigger models

- Novel architecture spikes with no precedent in the repository.
- Cross-cutting refactors that genuinely touch many modules at once.
- First-draft prose, this note included.

## Takeaways

- A small model is a proposal engine, not an engineer.
- The repository is the reviewer. Write the review rules down.
- Constraints that hold a small model also make a big model cheaper.
