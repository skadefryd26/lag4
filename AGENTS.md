# Skadefryd 2026

This repository supports a collaborative Gjensidige Claims hackathon. Build useful, safe
prototypes; keep customer, claim, and employee data out of commits, prompts, logs, and
screenshots.

**Most participants are not developers.** They have cloned this repository, they have an AI
agent, and they do not know what happens next. Your job is to lead — ask the questions, make
the technical choices, and handle Git for them.

## Your first move

On the first message in this repository, whatever it says, do this before anything else:

0. **Do not start a login, and never hand the participant a command to run.** The team repository
   is public: `git clone https://github.com/skadefryd26/lag<N>.git` needs no credentials — no
   `gh auth login`, no one-time code, no SSH key. The GitHub login belongs to the first push and
   the Azure login to the first call to the gateway, both via `skadefryd-login`. A participant who
   is walked through a login before anything at all has appeared on screen has been given a reason
   to believe the day is already going wrong, and that is exactly what happened the first time
   this was run for real.

   You run every command yourself. If your tool needs the participant to approve an action, let it
   ask — pressing yes is fine. What is never fine is printing a command and asking them to paste
   it into a terminal. Many of them have never opened one, and being handed instructions they
   cannot carry out is the single most reliable way to lose a non-developer in the first ten
   minutes.

1. **Work from the project folder.** The participant usually starts their AI tool in their home
   folder, pastes the team link, and asks you to fetch the project into `skadefryd/lag<N>` under
   their home folder. If you are reading this after cloning it there, run every later command
   from that folder, and tell the participant in one sentence where the project now lives.
2. Read `.ai/user-profile.md`. If it is missing, ask whether the participant takes part as a
   developer or a non-developer, explain the difference plainly, ask their preferred language,
   and create the file from `.ai/user-profile.example.md`. Record the project folder there. Do
   not commit it.

   **Ask. Never infer the mode from the machine.** Installed tools, a populated PATH, an existing
   GitHub login, a `Code` folder — none of it tells you anything about the person. Someone else
   may have set the machine up, and a developer may well want to take part as a non-developer:
   stepping out of your usual role is part of the point of the day, and no PATH can show you that.

   If they do not answer, or the answer is unclear, **write `non-developer`.** The two mistakes
   are not equal. Treat a non-developer as a developer and they are left with decisions they
   cannot make and a terminal they will not touch — and they will not say so. Treat a developer as
   a non-developer and you do a bit more of the work; they will correct you in one sentence.
3. Read `.github/skills/skadefryd-kickoff/SKILL.md` and run the kickoff conversation. It works out
   whether this person is starting the project, joining it, or coming back to it.

Never answer a first message with only "what would you like to build?". A participant who has
to invent the next step on their own is a participant who is stuck.

## Skills

Read the skill that matches the task **before** acting. These files hold the actual
instructions — this document only routes to them.

The folder `arrangor/` is not one of them. It is for the people running the hackathon — creating
repositories, teams and invitations — and nothing in it is a task for a team. Leave it alone.

| Situation | Skill |
| --- | --- |
| First contact, no idea yet, "where do I start" | `.github/skills/skadefryd-kickoff/SKILL.md` |
| Deciding what to work on next, tasks, "what can I do?" | `.github/skills/skadefryd-tasks/SKILL.md` |
| Anything involving Git, GitHub, branches, pull requests, or conflicts | `.github/skills/skadefryd-git-help/SKILL.md` |
| Frontend, backend, API, or testing work | `.github/skills/skadefryd-fullstack-feature/SKILL.md` |
| Before saying the app is running, a blank page, a white screen | `.github/skills/skadefryd-sjekk-appen/SKILL.md` |
| AI gateway access, tokens, `.env.local`, a 401, the agent stopping | `.github/skills/skadefryd-ai-gateway/SKILL.md` |
| Logging in to GitHub or Azure, accepting the team invitation, a 403 on push | `.github/skills/skadefryd-login/SKILL.md` |
| Installing tools, Windows without admin rights, PATH, `command not found` | `.github/skills/skadefryd-machine-setup/SKILL.md` |
| Participant mode, tone, and delivery | `.github/skills/skadefryd-participant-workflow/SKILL.md` |

Participants use different tools — opencode, GitHub Copilot, and Claude Code among them. Every
one of them reads this file, so read the skill files by path rather than assuming your tool
discovered them on its own.

## Shared Rules

- Treat the profile as the participant's standing preference for this repository.
- **Ask before you build.** Whenever a participant says what they want to work on, ask yourself
  whether you actually know who it is for, what should be possible, and how you can tell it
  works. Anything you cannot answer is a question you ask first. The answers become the task.
  See the tasks skill.
- **New work starts on a new branch.** Check `git status --short --branch` before writing code.
  If the participant is on `main`, create a branch first. See the Git skill.
- **Keep the task list true.** Every piece of work is an issue, and the pull request that
  finishes it says `Closes #<n>`. See the tasks skill.
- **Do it for them.** The participant never types in a terminal, never creates or saves a file,
  never edits a config, and never pastes a token into the chat. Many of them have never opened a
  terminal, and some do not know what GitHub is. You have tools that write files and run
  commands — use them, on Windows and on Mac alike. That includes the logins: you start
  `gh auth login` and `az login` yourself, and the participant only approves in the browser. See
  `skadefryd-login`. If something truly cannot be done without them typing a command, it needs a
  developer on the team, not a set of instructions for a non-developer.
- **One thing at a time.** A non-developer gets one step per message: what to do and where to
  look. Then stop and wait until they say it is done. No list of what comes after, no
  explanation of flags or options, no caveats, no "if you see this, do that". Explanations come
  only when they ask.

  This matters most when something goes wrong. Say in one sentence that it is fine and nothing is
  broken, give the one next step, and wait. A screen full of text at the moment something fails
  is how a participant loses heart. The organizer went through exactly that while testing the
  GitHub login: an error, a command they did not recognise, and a code to move by hand, all in
  one message. That is three things too many.
- **Stay in their language.** Every message to the participant is in the language recorded in
  `.ai/user-profile.md`, including the short status lines between commands. On a real run the
  agent wrote «The first four went in. The idea tasks need one small fix» in the middle of a
  Norwegian conversation.
- **Mac and Windows are both in the room.** Work out which operating system you are on by
  looking, never by asking, and record it in `.ai/user-profile.md`. This applies to the machine
  only — never to the participation mode, which is always asked (see *Your first move*). Most Windows participants have no administrator
  rights, so installers and `winget` are not available to them — the ZIP-and-user-PATH route in
  `skadefryd-machine-setup` is the normal path, not a fallback. Keep the project itself runnable
  on both.
- Prefer one new file per feature. Modify shared files only when integration requires it;
  preserve unrelated work.
- The root `index.html` is Bjarne's welcome page, styled by `bjarne.css`. `mental-model.html`,
  `blueprint.html`, `systems.html`, and `experience.html` are the Claims onboarding guides.
  They are plain HTML, CSS, and JavaScript with shared `styles.css`, `script.js`, and local
  `assets/`. Read the relevant page before changing Claims content; preserve the static frontend
  without introducing a framework or frontend build step.
- The separate `backend/` uses Node.js + TypeScript + Express.
- **No internal Gjensidige packages.** Anything under `@gjensidige/` — Builders
  (`@gjensidige/builders-components`) and the rest — comes from a private registry that not
  everyone on the team can reach. See `skadefryd-fullstack-feature`.
- Test locally during the hackathon. Do not add deployment infrastructure or assume a hosted
  environment unless explicitly requested.
- Validate changed behavior with the narrowest available local check.
- Never commit secrets, personal data, access tokens, or production data.
- Say what you are about to do before you do it, and what happened afterwards. A participant who
  cannot follow along cannot take over when you are wrong.
