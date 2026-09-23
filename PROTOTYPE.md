# Claims Tribe onboarding — local research prototype

This is a **single-user, loopback-only research demo**, not an authorized multi-user service. The nine-squad source snapshot is intentionally stored at `backend/private/evidence.json`, excluded from Git. It was assembled from Confluence squad/ownership pages, Jira items and GitHub CODEOWNERS visible to the researcher on 2026-09-23. The UI is usable locally with this snapshot but a teammate who clones this repository must obtain their own authorized snapshot; no internal source content is bundled with the frontend.

## Run and inspect

- `npm install` then `npm run dev` in the project folder. Set `LOCAL_RESEARCH_DEMO=true` in the **ignored** `.env.local` only on the researcher's own machine and place their authorized `backend/private/evidence.json` there. The backend binds only to `127.0.0.1`; the frontend proxies `/api` to it.
- `npm test`, `npm run build`, and `node scripts/sjekk-appen.mjs <actual Vite URL>` validate the prototype.
- In the interface: move between the nine slides; drill into Claims Communication to see **Newton/CF** aliases and people; ask **“Who owns claims-selector?”** to see **New** with links; ask **“Who owns gje-claim-overview?”** to see an **unclear** sole owner with both sources; click **Preview simulated surprise** for the Slack illustration.
- The optional **Ask Bjarne for a briefing** calls the Gjensidige AI gateway (`/openai/v1/responses`, `gpt-5.6-luna`) from the backend using `AI_GATEWAY_TOKEN` in `.env.local`. Answers to ownership/contact queries are deterministic evidence lookups; AI briefing is explicitly labelled as a generated summary. Never put tokens in the frontend.

## Evidence model

`Source { id, kind, title, url, updated }` describes an original document. `Squad { id, name, aliases, mission, domain, apps, systems, work, leaders, members, contacts, refs, conflicts }` is a curated set of claims with links to source IDs. `Ownership { term, squad | null, state, explanation, refs }` keeps application ownership separate from a shared namespace or CODEOWNERS. `asOf` is the snapshot date, not a claim that every source is current. A missing field is displayed as missing; provisional/unclear records are not treated as confirmed. **Cash = Edo; Claims Communication = Newton = CF** (user-confirmed alias mapping, 2026-09-23).

The older eight-row ownership page omits Enabler, while the later nine-row tech-lead list includes it. Cash's team roster and the central listing disagree on some leaders. `gje-claim-overview` has a draft naming Communication as owner and a CODEOWNERS file naming both `claims-newton` (Claims Communication) and `claims-hexa` (Hexacorn); code-review assignments cannot determine a sole owner. The linked system ownership database needs an authorized database connector before application ownership can be exhaustively verified. The developer portal catalog is `team-claims`-level and cannot allocate its entries to squads.

## Integration path for real onboarding

1. Authenticate each viewer via organization SSO; obtain **delegated, user-scoped** access to Confluence, Jira, GitHub, and (when approved) Slack. Do not use a shared administrator token or a researcher's snapshot for other viewers.
2. Retrieve source documents on behalf of the viewer; enforce their permissions **before** indexing, summarizing, caching, or sending text to AI. Partition any index/cache by user and entitlement, honor removals/revocations and record source version + update time. Do not rely on a link that might later deny access as the only access control.
3. Parse exact claims into fact records with `subject`, `predicate`, `value`, `sourceId`, `location`, `updatedAt`, `retrievedAt`, `visibility`, `confidence`, and `conflictsWith`. Preserve disagreeing claims; never silently choose the newest timestamp as truth. Prefer an approved ownership database for explicit owner assignments, Confluence for documented scope/rosters, Jira for current work and GitHub for repository review/maintainer evidence.
4. Answer only from viewer-authorized evidence. Attach a link and last-updated time to each claim; quote conflicting alternatives and mark unknowns. AI may rewrite a verified answer in Bjarne's tone, but cannot invent facts or references. Check model output against evidence before presenting it as confirmed.
5. **Slack** requires an approved integration with read scope restricted to an explicitly chosen channel (`SLACK CHANNEL TBD`), a defined non-sensitive trigger (`TRIGGER TBD`), and a product-approved presentation action (`ACTION TBD`). No Slack MCP connection is available in this run. The current easter egg is simulated, performs **no read**, and never posts. Any future posting or mutation must be a separate action with a preview and explicit user confirmation. Never ingest private messages or show message authors unnecessarily.

## Visual and accessibility decisions

The full-page layout is a hero, keyboard-navigable slide-like deck, nine-card directory, question/answer panel, and read-only Slack demonstration. The squad detail page contains domain, applications, systems, work, people, uncertainty, source links, and an optional AI briefing. On narrow screens the cards and detail columns stack and the search controls become vertical. Native buttons and semantic headings support keyboard use; answer/loading/error messages use live regions. CSS uses the **actual installed** `@gjensidige/builders-tokens@2.3.0` custom properties (`--builders-*`), and the UI uses installed Builders buttons/badges and fonts with the prescribed React/TanStack/Mantine stack. This is a research interface, not a design-system-complete production release.

## Remaining gaps

- Viewer-specific OAuth/SSO, delegated source clients, an authorization-aware index, access revocation and audit are required for production; this build deliberately rejects `/api` unless local demo mode is explicitly enabled.
- The linked Confluence ownership database could not be queried with the available page tool. Squad owners must confirm ambiguous assignments and stale roster entries.
- Some squads have no sourced current work, applications, mission, or named contact in this snapshot. Each needs a maintained squad landing page, current Jira project/board mapping, and squad owner verification.
- Supply an approved Slack channel, trigger and action plus authorized reader; no message content is used in the simulated easter egg.
