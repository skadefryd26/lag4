---
name: skadefryd-participant-workflow
description: 'Use when starting or continuing work in Skadefryd 2026, identifying a participant as developer or non-developer, explaining work in an accessible way, or delivering a change through a branch, commit, push, and pull request.'
---

# Skadefryd Participant Workflow

## Establish the participant mode

1. Read `.ai/user-profile.md`.
2. If it does not exist, ask: "Are you participating as a developer or non-developer?" Explain that developers can choose technical details, while non-developers can focus on the desired user experience and outcome. Ask their preferred language if relevant.
   **This is asked, never inferred.** Do not read it off the machine — installed tools, a GitHub login already in place, or a developer-looking home folder say nothing about the person, and someone who can code may still want to take part as a non-developer today. If you get no clear answer, write `non-developer`: a non-developer treated as a developer gets stuck silently, while a developer treated as a non-developer just corrects you.
3. Create `.ai/user-profile.md` by copying the structure in `.ai/user-profile.example.md` and record the answer. Confirm that the file stays local and is ignored by Git.
4. Follow the saved mode for later conversations unless the participant asks to change it.

## Two things are called "the agent"

`README.md` teaches participants to keep these apart, so use the same words they do:

- **opencode** is what most participants call you, because it is the tool most of them use. If
  they use Claude Code or Copilot, use that name instead. When you mean yourself, say «jeg».
- **Bjarne** is the AI they are building. Call it «Bjarne», never «agenten».

Saying "agenten" for both is the fastest way to confuse someone on their first day. When you mean
yourself, say "jeg". When you mean their product, use its name.

## Work with a non-developer

- Start with who needs the feature, what they need to accomplish, and how success looks. Offer small, concrete options when a decision is needed.
- Translate technical work into plain language. Say what will happen before running commands and summarize the outcome afterwards.
- Make sensible technical choices yourself using this repository's standards. Do not make the participant choose libraries, file layouts, commands, or Git mechanics unless they ask.
- Before any new work begins, make sure it is on its own branch. Follow `skadefryd-git-help`.
- After the feature is agreed and validated, handle delivery yourself: commit the intended changes, push, create a pull request, and merge it. Inspect the working tree first and never include unrelated changes. `skadefryd-git-help` covers the whole flow, including conflicts and review comments.
- **Delivery ends when the work is in the team's version, not when the pull request exists.** Never ask a non-developer to merge — check whether it merges cleanly yourself, resolve it if it does not, and then ask one plain question about the product: «Skal jeg legge dette inn i lagets versjon?» «Kan du merge den?» is an instruction they cannot act on, the same way «lag en fil» is. See `skadefryd-git-help`.
- **Always say what happens next — and make it something *they* do.** A non-developer has no way of knowing what a reasonable next move is, so a step that ends without one leaves them sitting and waiting. But «skal jeg hente en ny oppgave?» is not a next step for them; it is a next step for you, with them as the person who says yes. A whole day of that leaves someone who pressed buttons and approved things, and they will not feel they built anything.
  End on what is theirs to decide or to own: what to try, what to change, what to take on next. «Det ligger inne nå. Vil du ta neste bit selv? Det står tre forslag på tavla, og jeg vil anbefale kaffeknappen — du bestemmer hva Bjarne sier når han får kaffe, så skriver jeg det.» This applies to the small moments too: after a push, after the app starts, after a fix works.
- **After an interruption, find out what actually happened before you carry on.** You stop dead
  when the connection goes — a sleeping machine, a changed network, a closed lid — and you do not
  come back by yourself; the participant has to interrupt you and say carry on. When they do, you
  have no idea how far you got. Your last message is not evidence. Look: `git status --short`, what
  the branch has, whether the install finished, whether the dev server is still serving. Then say
  in one sentence what you found and what is left, so they are not the one holding the uncertainty.
- Do the work yourself. Never ask a non-developer to create a file, copy a template, edit a config file, or run a command — write the file and run the command with your own tools. Telling someone who does not know how to create a file that they need to create one is where they stop.
- The participant never types in a terminal. The only thing they do themselves is approve a login in the browser: you start `gh auth login` and `az login`, show them the link and the code, and wait. Follow `skadefryd-login`. Never ask for or echo a token, and never let one appear in the chat. For AI gateway access, follow `skadefryd-ai-gateway`.
- **Never give an address, port or number from memory.** Every URL, port and link you hand a participant is looked up first — the dev server's actual output, the board's real URL, the pull request that was just created. These skills contain example sentences with addresses in them; they are placeholders, not values. A participant who is sent to the wrong address cannot tell whether they did something wrong or the thing is broken, and it happens at exactly the moments that matter most.
- Explain every technical word the first time you use it, in one short sentence: branch, repository, pull request, `localhost`, GitHub. Say what will happen before it happens, and what happened afterwards. Never say "just", "simply", or "of course" — when it does not work, those words tell the person the problem is them.
- When you send them to the browser to look at the app, explain `localhost` the first time: "`localhost` betyr denne maskinen — appen kjører bare hos deg, og ingen andre kan se den ennå." Say what they should see, so they can answer yes or no.

## Work with a developer

- Be concise and technical where it helps. Surface meaningful implementation choices and validation results.
- Do not create branches, commits, pushes, or pull requests unless explicitly requested. When asked, follow `skadefryd-git-help`.

## Shared collaboration approach

- Keep each feature isolated in new files wherever practical. Give files purposeful names and make minimal integration edits.
- Before delivery, identify the relevant changed files, run the narrowest feasible validation, and report remaining limitations honestly.
- Use Conventional Commits when creating commits.
- If the participant has no idea yet, or the project has no code, run `skadefryd-kickoff` before anything else.
