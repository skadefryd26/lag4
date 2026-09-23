---
name: skadefryd-sjekk-appen
description: 'Read before telling a Skadefryd 2026 participant that the app is running, that a change is ready to look at, or before sending them to a localhost address — and when a page is blank, shows a white screen, or works in the terminal but not in the browser. Covers scripts/sjekk-appen.mjs, which opens the app in a real browser and reports console errors, failed API calls and empty pages.'
---

# Skadefryd Sjekk Appen

**Never say the app is up until a browser has opened it and come back clean.** Not "nå kjører
den", not "prøv nå", not "den er klar" — nothing that sends a participant to look at a screen.

This is not caution for its own sake. The first time a team opened their own frontend, it showed
an error. Everything upstream had looked fine: the install ran, the dev server printed an
address, the terminal was quiet. **A dev server answers `200` for `index.html` even when the app
crashes on the way up**, so "the server is serving" says nothing about what the participant sees.
For a non-developer the app *is* the screen, and the one moment the morning has been building
towards is the one that broke.

## The check

```bash
node scripts/sjekk-appen.mjs http://localhost:5173
```

Use the address the dev server actually printed, never one from memory — the port is rarely the
one you expect.

It opens the page in a real browser, runs its JavaScript, and reports:

- uncaught JavaScript errors and errors in the console
- responses of 400 and up, including the team's own `/api` calls
- requests that never arrived at all
- Vite's red error screen
- a page with no visible text on it — the blank screen, which is the failure that looks like
  success everywhere else

It exits `0` only when the page is clean, and leaves `sjekk-appen.png` behind either way. Look at
that screenshot before you describe the screen to anyone: it is what they are about to see.

## First time in a project

Once per project, before the first check:

```bash
npm install --save-dev playwright-core
```

That is one small package, not a browser download. The check drives the Chrome or Edge that is
already on the machine. Only if the machine has neither does it ask for Playwright's own browser,
and it says so itself.

**Give the command a generous timeout — a minute is plenty.** A clean page comes back in about a
second and a broken one in under ten, but the first browser start on a cold machine is slower. A
check your tool kills halfway is worse than no check: it tells you nothing and looks like a
failure.

## When it comes back red

Fix it, then run it again. That is the whole loop, and it happens before the participant hears
anything at all.

- **A blank page with a JavaScript error** — read the error. It is nearly always the real cause,
  and nearly always in the file you last touched.
- **A `404` on something under `/api`** — the backend is not running, or the frontend is calling a
  path the backend does not have. Check both are up before rewriting either.
- **A `401` from the gateway** — the token, not the code. See `skadefryd-ai-gateway`.
- **Nothing answers at all** — the dev server stopped, or you are checking the wrong address.

Do not hand the participant a stack trace, and do not narrate the repair while it is going on. A
short "jeg fikser en feil først" is enough. What they should never get is an address that shows
them a broken page.

## Run it again after every change

The check is not only for the first version. Run it before every "prøv nå" — a change that
compiles can still blank the screen, and the participant should never be the one who discovers
that.

When it is green, say what they should be looking at, concretely enough to answer yes or no.
Name the thing on the screen, not the work you did.

## What it does not cover

It sees the first screen, not the idea. It cannot tell you whether the answer from the agent is
any good, whether the copy is right, or whether the thing is fun. That is what the participant is
for — but they can only judge it once they can see it.
