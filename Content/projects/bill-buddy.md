---
title: Bill Buddy
summary: A recurring bill tracker with due-date previews, payment status, and durable local browser state.
status: shipped
role: Frontend Developer
tags:
  - React
  - Tailwind CSS
  - localStorage
  - UUID
repositoryUrl: https://github.com/NMasters52/budget-app
liveUrl: https://budget-app-woad-one.vercel.app
updatedAt: 2026-05-09
image:
  src: ../images/bill-buddy-home.jpg
  alt: Bill Buddy Add New Bill form showing bill title, amount, dates, frequency, and auto-calculation controls.
---

## What it does

Bill Buddy keeps recurring household bills in one place. It supports weekly, biweekly, monthly, quarterly, biannual, and yearly schedules; shows upcoming due dates and payment status; and previews the amount due across a selected seven-day window.

Bills can be added, edited, deleted, sorted, filtered, and marked paid. The app stores its data in the browser's localStorage, so it needs no account or signup.

## How it works

The frontend is built with React and Vite, styled with Tailwind CSS, and deployed on Vercel. React Icons supplies the interface icons and UUID supplies stable bill identities. Date utilities calculate the next due date and keep payment history moving forward when a bill is marked paid.

## Where it stands

Bill Buddy is shipped and available at the live site. Its current implementation remains intentionally small: browser-local state, no backend, and no authentication.
