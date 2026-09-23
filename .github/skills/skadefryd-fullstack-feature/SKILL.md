---
name: skadefryd-fullstack-feature
description: 'Use when creating, extending, debugging, or testing a Skadefryd 2026 frontend, backend, API endpoint, React screen, TanStack Router route, TanStack Query request, Mantine UI, Express service, or TypeScript feature.'
---

# Skadefryd Full-Stack Feature

## Technology baseline

- Frontend: React, TypeScript, Vite, TanStack Router, TanStack Query, and Mantine.
- Backend: Node.js, TypeScript, and Express.
- Add another library only when it materially helps the requested feature; explain its purpose briefly.
- **Never install internal Gjensidige packages**, such as Builders (`@gjensidige/builders-components`)
  or anything else under `@gjensidige/`. They come from a private registry, and not everyone on the
  team has access to it. It might install on one machine and then break `npm install` for every
  teammate who pulls the change.

  If someone asks for them, say kindly, in one sentence, that it is not possible today, and offer
  what you will do instead: «Det går dessverre ikke i dag, for ikke alle på laget har tilgang til
  Gjensidige-pakkene. Jeg kan få det til å se Gjensidige-aktig ut med Mantine i stedet — skal jeg
  gjøre det?» Then do it with a Mantine theme: colours, typeface and spacing.

## Build a feature

1. Establish the participant mode with the `skadefryd-participant-workflow` skill.
2. Make sure the work is on its own branch before writing code. Follow `skadefryd-git-help`.
3. Locate the nearest owning frontend or backend module and one focused test or usage. For a new project, first create a clear `frontend/` and `backend/` boundary.
4. Prefer feature-local additions: a route/screen, UI component, query hook, API client, server router, controller, or test in a new feature-named file. Change shared registration, routing, or exports only to connect the addition.
5. On the frontend, use TanStack Router for navigation, TanStack Query for server data, and Mantine components and theming for UI. Keep API requests out of presentational components when a feature hook or API module is appropriate.
6. **Make it look like something, and slightly too much.** The default Mantine form on a white page is the failure mode here — it reads as an internal admin tool, and a team that sees one stops believing their idea is any good. Give it a look with the first version, not as a later polish step: a committed theme rather than the default one, a real typeface, generous spacing, and a title with the same attitude as the agent. Give the agent a face — an avatar, a colour, something that is recognisably them. Make the waiting visible and in character: they should be *thinking*, sighing, or arguing with themselves, never a bare spinner. Animate the answer as it arrives. This is what the room sees during the demo, and it is most of what makes a team proud of what they built. Do not spend the morning on CSS — it should take minutes, not hours, and it never comes before the thing actually working.
7. On the backend, expose typed Express request and response boundaries, validate untrusted input, return useful HTTP status codes, and keep route wiring separate from feature logic when practical.
8. When the feature talks to the AI gateway, follow `skadefryd-ai-gateway`. Set up `.env.local` and the token yourself before the first call rather than after it fails, and keep the token in the backend — never in a `VITE_` variable or anywhere the browser downloads.
9. Keep the project runnable on both macOS and Windows. Team members will have both. Do not put `VAR=value command` in an npm script — that is bash syntax and fails on Windows. Read configuration from `.env.local` in code instead, keep paths out of scripts, and make sure `npm install` and `npm run dev` are the only two commands anyone needs.
10. Do not use real customer, claim, employee, or secret data. Use clearly fictional examples.

## Validation

1. Test locally: run the narrowest existing test, typecheck, lint, or build command, then start the relevant local frontend or backend where behavior needs hands-on verification.
2. For a UI change, verify the normal, loading, empty, and error states where applicable in the local application.
3. **Show it running before you say it is done.** For a non-developer, a change they cannot see has not happened. Start the app yourself if it is not already running, then verify it in a real browser with `skadefryd-sjekk-appen` — «serveren svarer» is not the same as «det står noe på skjermen», and a change that compiles can still blank the page. Only when the check is clean do you open the browser at the address and say what they should be looking at so they can answer yes or no. «Det er implementert» is not a result; «prøv å skrive noe i feltet nå, så sukker Bjarne før han svarer» is. Leave the server running between changes rather than stopping and starting it around other commands.
3. Do not add deployment configuration or rely on a hosted environment during the hackathon unless explicitly requested.
4. State exactly what ran locally and any validation that could not run.
