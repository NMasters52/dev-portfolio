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

I've been experimenting with how far I can push smaller, faster models for real software work.

My workflow lately has been built around ChatGPT's Luna model on Lite mode, Matt Pocock's skills, and GitHub issue tickets for triage, memory, and goal alignment. The model is cheap and fast. Pair that with strong guardrails and a good harness, and you can get a surprisingly capable workflow without burning through tokens or constantly reaching for a frontier model.

I'm currently paying for the $20 Plus plan, and I still haven't consistently hit the limits. Granted, I work a full-time job that isn't currently a developer role, but I use this subscription every day for coding and other work. Being able to use it that often without regularly hitting limits is a big part of the value for me.

## The Guardrails

I try to keep my guardrails organic.

I'm not interested in building an enormous collection of prompts that I have to constantly maintain. I want the repository itself to do as much of the steering as possible.

That means things like `AGENTS.md`, TypeScript's self-documenting nature, solid repository documentation, existing patterns, naming conventions, and reusable skills.

These things make smaller, scrappier models much more useful.

A good example is how I handle React Query. My query and mutation patterns are documented and modular, and the codebase has a shared vocabulary for how things should be named and structured.

When I ask an agent to build a feature, I don't need it to invent the architecture from scratch. I can point it at an existing mutation or query and effectively say, "Follow this pattern for the new feature."

If every mutation uses similar naming, file structure, function signatures, and invalidation patterns, the model has much less to figure out.

I'm reducing the amount of reasoning it needs to do.

That's where smaller models start becoming really effective.

I'm currently using Codex inside VS Code with the Codex extension. I like being able to see the diffs and maintain visibility into exactly what is being written or merged.

I don't take this approach with every project. For one-off experiments, I'm much more willing to let an agent run.

With Disc Golf Labs, it's different.

I care about what gets written there. If I'm going to ship the code, I want to understand the decisions behind it and be able to own those decisions later.

## The Pitfalls

There are still plenty of areas where a lightweight, fast model can get you into trouble.

The biggest one is ambiguity.

The stronger frontier models are getting better at inferring intent from a vague task. You can sometimes give them an incomplete idea, answer a few questions, and watch them get surprisingly close to the result you had in your head.

I don't expect that from the smaller models. With them, I'm pair programming. The model and I need to stay aligned on what task we're solving, why we're solving it, and what "done" actually means.

These models also tend to aggressively optimize for the goal you've put in front of them. That's incredibly useful when the goal is clear. It's also one of the biggest foot guns when it isn't.

I've been using Matt Pocock's `/grill-me` skill for this. The skill forces me to clarify and polish an idea before handing it off for implementation. It helps expose the assumptions that otherwise stay stuck in my head.

`/wayfinder` is another useful one. It helps define the destination and work backward toward a reasonable path to get there.

Both skills help me align myself and the model before spending a large amount of context or implementation effort.

## Staying in the Smart Zone

Context management has also become part of the workflow. In my experience, once a session starts getting much beyond roughly 150k tokens, I trust the model less. I think of that range as the "smart zone," borrowing the term from Matt Pocock's teaching.

A GitHub issue becomes a useful boundary. Finish the task, capture the important decisions, merge it, and start the next task with a cleaner context.

## You Are Part of the Model's Ceiling

The floor for building software has risen dramatically. Someone with very little software experience can now produce a working website. It might not be particularly good software, but the fact that they can produce it at all is a meaningful change.

I don't think that makes software engineering expertise less important. I think it changes where that expertise matters. If producing code becomes cheaper, judgment about what code should exist becomes more valuable.

The agent can suggest another abstraction, a view model, five unit tests, or another `useEffect`. Somebody still has to decide whether any of those things actually belong in the system.

The model doesn't have durable ownership of the codebase. It doesn't have deterministic outcomes. It doesn't truly remember why a decision was made six months ago unless that decision has been captured somewhere it can access.

We need to recognize when the agent is following a pattern versus inventing one. We need to know when a test protects meaningful behavior and when it's just increasing coverage. We need to catch the unnecessary abstraction that looks reasonable in a diff but makes the system harder to maintain.

In that sense, we're part of the model's effective ceiling.

## Summary

Lightweight models are extremely useful for building software. With strong guardrails, a good harness, clear task boundaries, and active alignment with the person using them, they can produce meaningful work quickly and cheaply.

The better I get at documenting patterns, defining tasks, managing context, reviewing decisions, and knowing when the model is wrong, the more useful these tools become.

The model is getting better, but so is the environment I put around it. Increasingly, I think that's where the leverage is.
