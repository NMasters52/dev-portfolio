---
title: GitHub Finder
summary: A GitHub profile search interface with recent searches, responsive results, and cached data handling.
status: shipped
role: Frontend Developer
tags:
  - React
  - TypeScript
  - Vite
  - TanStack Query
  - Tailwind CSS
  - React Icons
  - use-debounce
repositoryUrl: https://github.com/NMasters52/github-finder
liveUrl: https://github-finder-wf5f.vercel.app
updatedAt: 2025-10-22
image:
  src: ../images/github-finder-populated.jpg
  alt: GitHub Finder showing a populated ThePrimeagen profile result and recent search.
---

## What it does

GitHub Finder searches for GitHub users and presents their profile details and latest repositories in one focused view. It links directly to the user's GitHub profile, remembers recent searches in local storage, and offers suggestions while a username is being entered.

## How it works

The app is built with React, TypeScript, and Vite. TanStack Query manages GitHub API requests, caching, synchronization, and loading or error states. Tailwind CSS handles the responsive interface, while React Icons supplies the interface icons and use-debounce supports the search suggestions.

## Where it stands

GitHub Finder is shipped and available at the live demo. The repository describes it as a responsive application built to practice server-state management with TanStack Query. There are no published usage or performance metrics to add here.
