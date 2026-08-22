---
title: Disc Golf Labs
summary: A training platform for disc golfers, combining putting games, analytics, courses, progress tracking, and authenticated coaching tools.
status: in-progress
role: Founder
tags:
  - React
  - TypeScript
  - Clerk
  - TanStack Query
  - Stripe
  - Tailwind CSS
  - shadcn/ui
  - MongoDB
  - Express.js
repositoryUrl: https://github.com/NMasters52/DiscGolfLabs-Frontend
updatedAt: 2026-08-10
---

## The problem

Practice in disc golf is mostly unstructured. Players head to a field or a basket, putt for an hour, and leave with no record of what improved. Coaching content exists, but it stops at advice. It does not measure the practice it prescribes.

Disc Golf Labs is built for recreational and competitive players who want practice to behave like training: repeated drills, honest numbers, and visible progress over weeks rather than vibes.

## What it is

A training platform organized around putting, the most coachable part of the game. Putting games set the drill, analytics score it, and progress tracking keeps the history. Accounts via Clerk keep a player's practice theirs across devices.

- **Putting games** use structured drills with scoring, not free putting.
- **Analytics** show distance and session trends instead of a single round score.
- **Courses** make practice layouts and repetition concrete.
- **Progress tracking** keeps the longer history a player actually cares about.

## How it's built

The React and TypeScript frontend uses TanStack Query for server state, Tailwind CSS and shadcn/ui for the interface, Clerk for authentication, and Stripe for billing. The frontend repository's README references an Express.js and MongoDB backend while the platform is pre-launch.

## Where it stands

Disc Golf Labs is in progress toward a Fall 2026 release. The product is real and moving, but there are no outcome metrics to publish yet: no user counts, revenue, or launch.
