# Claims Onboarding Reference Site

This directory is a static HTML, CSS, and JavaScript prototype that provides product and design
context for Claims onboarding work in `lag4`. It is reference material, not the main application.

## What it contains

- `index.html` — the Claims mental model and the EVA, Frank, and Sofie corridors.
- `blueprint.html` — the claims journey swimlane and detailed system reference.
- `systems.html` — the customer-facing, handler, and backend system catalogue.
- `experience.html` — the future-state customer experience journey.
- `styles.css` — shared visual language, layout, colors, spacing, and responsive behavior.
- `script.js` — the small amount of interaction used by the Systems tabs.
- `assets/` — local logo and persona SVG assets.

## How agents should use it

- Read the relevant page before changing or designing Claims onboarding experiences.
- Treat the content, journey stages, system names, personas, and visual language as the team's
  current reference context unless the user gives newer direction.
- Preserve the static prototype when implementing a separate application. Do not convert it to a
  framework or replace it with a build setup unless the user explicitly asks for that.
- Keep customer, claim, employee, credential, and production data out of this folder and out of
  screenshots, prompts, and commits.
- This prototype has no package manager or build step; its pages use shared local assets only.
