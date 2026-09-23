---
name: skadefryd-tasks
description: 'Use whenever a participant says what they want to work on next, brings up an idea, starts or finishes a piece of work, opens a pull request, asks what the team is working on, or asks what they can contribute. Covers asking the clarifying questions that define a task, keeping the team''s task list as GitHub issues, and how the team board follows them. Read this before starting any new piece of work.'
---

# Skadefryd Tasks

Every team has its own repository (`lag1`, `lag2`, ...) and a board with the same name. The team's
tasks are the **issues** in that repository. That is the shared picture of who is doing what, and
it is what a teammate reads when they ask what they can help with.

**The participant never manages the task list. You do.** Do not ask what a task should be called
or whether it should be created. Work it out, do it, and say in one sentence what you did.

**You never touch the board.** It updates itself: a workflow in the repository
(`.github/workflows/board.yml`) reads the issues and pull requests on every change and puts each
card in the right column. Your job is to keep the issues true — create them, assign them, label
them, link the pull request — and the board follows within a minute. Issues need nothing beyond
the ordinary GitHub login from `skadefryd-login`, so no participant needs an extra permission.

## Show them the board, once, without being asked

**Do not wait for someone to ask where the board is.** A participant who has never used GitHub
does not know that a board exists, so they will never ask for it — and then they never see that
the work has a shape. This is the single thing most likely to be missing from their day.

**Show it the first time you tell them what could happen next — not when you create the issues.**
Issues are usually created while the participant is watching you work, or not watching at all, so
a mention there passes them by. The board matters the moment it can answer a question they
actually have: «hva kan jeg gjøre nå?» That is when you give them the link:

**Look the address up and give the one that opens their board.** Never send them to the list of
all the organization's projects and ask them to find their own — that is one more place to get
lost, for no reason. The project number is assigned by GitHub and differs per team, so ask the
repository for it:

```bash
gh api graphql -f query='
  query($org:String!,$repo:String!){ repository(owner:$org,name:$repo){
    projectsV2(first:1){ nodes{ url } } } }' \
  -f org=skadefryd26 -f repo=lag<N> --jq '.data.repository.projectsV2.nodes[0].url'
```

Then say it in two sentences, with that exact address:

> «Her er lagets tavle: <lenka fra kommandoen over>. Hver oppgave flytter seg selv fra Klar til
> Under arbeid til Ferdig mens vi jobber, så dere ser hvor dere er uten å spørre noen.»

Say it again, once, the first time a card actually moves — when their own pull request appears in
`Review`, or the first issue closes. Seeing their own work move is what makes the board real; a
link alone is just another URL they will not open.

If the board is missing or looks wrong, that is for the organizers — say so in one sentence and
carry on. Never let the board block the actual work.

## «Hva gjør jeg nå?»

This is the question a non-developer has in their head most of the day, and most will ask it at
most once. Answer it properly.

**An open question is not an answer.** «Hva har du lyst til å gjøre?» hands the problem back to
someone who does not yet know what is possible. Neither is «skal jeg gjøre X?», which leaves them
approving your plan rather than having one.

Give them a small menu and a recommendation:

- **Two or three concrete things**, from the board, in plain language — what the user would see,
  not what the task is called. Say which you would take and why, in one sentence.
- **Say how it will work**, because that is what decides whether they dare: they choose and
  decide the content, you do the typing and explain as you go. Spell it out the first time —
  «du bestemmer hva Bjarne sier, jeg skriver det inn».
- **Include one that is purely about words or judgement**, not plumbing. What Bjarne answers when
  someone is angry, what the button should say, which of two replies is funnier. Someone who has
  never built anything can own that completely and immediately, and it is usually the part that
  decides whether the demo lands.
- **Show them the board in the same breath**, as the menu the suggestions came from. That is what
  makes it worth opening.

Then let them pick, including picking something you did not offer.

## Ask before you build

Before any work starts, ask yourself: **is there a question I should ask to understand what we
are actually building?** If the answer is yes, ask it before writing code, not after.

This is the point of the whole skill. A task written from a vague wish produces the wrong
feature, and on a one-day hackathon there is no time to build it twice.

When a participant says what they want to work on, check whether you know all four of these:

1. **Who is it for** — the end user, the team itself, or a made-up character.
2. **What should be possible** — the concrete thing the user can do when this is finished.
3. **How you can tell it works** — what you would look at on screen to say it is done.
4. **What is not included** — the nearest thing this is *not*, so the work has an edge.

Anything you cannot answer is a question you ask. Ask **one at a time**, with two to four
concrete options plus a free answer, and stop as soon as the task is clear. Two sharp questions
beat six thorough ones — you are defining one hackathon task, not writing a specification.

Bad: "Hva er kravene til chatten?"
Good: "Skal Bjarne svare med én gang, eller skal det se ut som han skriver? Det siste føles mer
levende, men er litt mer jobb."

When the participant does not know, suggest the answer you would pick and why. They can say no.
Never leave a question hanging as homework.

Write the answers into the issue body. That is what turns a wish into a task.

## Where a task stands

The column on the board is worked out from the issue, so this is what you change:

| Column | What makes a card land there |
| --- | --- |
| `Idé` | Open issue with the label `idé` |
| `Klar` | Open issue, no `idé` label, no assignee |
| `Under arbeid` | Open issue with an assignee |
| `Review` | An open pull request whose body says `Closes #<n>` |
| `Ferdig` | Closed issue, normally closed by the merged pull request |

`Idé` and `Klar` are deliberately separate. Nothing loses the `idé` label until the four questions
above are answered. If you are about to write code for something still labelled `idé`, you
skipped the questions — go back and ask them.

## Create a task

```bash
gh issue create --title "<what the user can do>" --body "<the four answers>"
gh issue create --title "<...>" --body "<...>" --label idé      # something for later
```

Title the issue after the outcome for the user — "Bruker kan sende melding til Bjarne" — not after
the technical work. Keep the body short: who it is for, what should be possible, how to tell it
works, what is out of scope.

When something comes up that the team is not doing now, still capture it as an `idé` issue. It
costs one command, and it is how good ideas survive until after lunch.

## Pick up a task

**Ask before you suggest.** When someone wants something to do, the first question is whether
they already have something in mind — «har du noe du har lyst til å lage?». If they do, that is
the task, and it beats anything on the board because they will care how it turns out. Take it
however small or odd it is, run it through the four questions above, and build it.

Only when they have nothing, look at the board:

```bash
gh issue list --state open --json number,title,assignees,labels
```

Suggest one open issue without an assignee and without `idé`. Pick by what is free and small
enough to finish, **not by what the person does for a living.** Do not steer the developer towards
the backend or the person from marketing towards the text. Who does what is the team's business,
not yours — and a suggestion that sounds sensible is rarely questioned, so a single nudge here
decides it for them.

Whoever takes it, say plainly how it will work — that you do the typing and explain as you go.
That is what makes a real task possible for someone who has never written code. Once they say
yes, take it for them and start the branch (`skadefryd-git-help`):

```bash
gh issue edit <n> --add-assignee @me
```

If an `idé` issue is picked up, ask the four questions first, write the answers into the body, and
remove the label: `gh issue edit <n> --remove-label idé`.

## When the first version works, the tasks become theirs

Up to this point you have written the task list, because nobody could have written it before
there was something to look at. That changes the moment the first version runs on screen. From
then on, **the best tasks come from the participant, not from you.**

Ask, as soon as they have seen it work:

> «Nå kjører den. Hva er det første du har lyst til å gjøre bedre?»

Then take whatever they say — however small, however vague, «den er litt kjedelig» counts — run
it through the four questions above, and make it a task. It is theirs, so they will care how it
turns out.

- **Ask what annoys them, not what is missing.** «Hva irriterer deg med den nå?» gets a real
  answer. «Har du flere krav?» gets silence.
- **Never answer with your own list first.** If you open with three suggestions, they will pick
  one of yours and stop producing their own. Ask, wait, and only help if nothing comes.
- **Take the silly ones seriously.** «Bjarne burde sukke høyere» is a perfectly good task, and it
  is often the one that makes the demo. Do not steer them towards something more sensible.
- **Push for more once one lands.** When their change works on screen, ask the question that
  makes people brave: «Hva er det mest overdrevne vi kunne lagt til nå?»

Keep making issues out of everything they say they want later, labelled `idé`. A team that sees
its own ideas on the board keeps producing them.

## Finish a task

Put `Closes #<n>` in the pull request body. GitHub closes the issue when the pull request is
merged, so nobody has to tidy up afterwards.

## Keep it quiet

Task housekeeping is background noise, not the conversation. One short line — "Laget oppgave #4 og
satt deg på den" — and then back to what the participant cares about. Never show them raw JSON,
ids, or a wall of `gh` output.

If `gh` fails because the participant is not logged in, follow `skadefryd-login`. Never let the
task list block the actual work. Build the thing, and create the issue once the login is sorted.

Do not run `board.mjs` yourself and do not ask for `project` access. The script is for the
workflow and the organizers.
