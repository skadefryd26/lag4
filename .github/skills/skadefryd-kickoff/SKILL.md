---
name: skadefryd-kickoff
description: 'Use at the very first interaction in Skadefryd 2026, when a participant has just pasted their team link, has just cloned the repository, comes back after closing their AI tool, has no idea yet, asks what to build, asks where to start, or the project has no application code. Works out whether this person is starting, joining or returning, and runs the guided conversation from blank slate to a chosen idea, a saved start prompt and a first version on main.'
---

# Skadefryd Kickoff

This skill runs the opening conversation. Most participants are non-developers who have
just cloned a repository and do not know what happens next. Lead the conversation. Do not
wait to be asked.

## Open the conversation yourself

When this is the first exchange in the repository, greet the participant and take charge of
the next step. Never answer a first message with only "what would you like to build?".

Before anything else, establish the participant mode with the `skadefryd-participant-workflow`
skill. Then check what already exists, in this order:

Run `git pull` on `main` first, so you see what the team has pushed since the folder was cloned.

1. `.ai/project.md` — the team's chosen idea. If it exists, the idea is settled: summarize it
   in two sentences. `.ai/startprompt.md` next to it holds the full brief — read it before you
   build anything.
2. Application code (`frontend/`, `backend/`, `package.json`). If it exists but `.ai/project.md`
   does not, infer the project from the code, confirm the summary with the participant, and
   write `.ai/project.md`.
3. Neither — this is a fresh start. Run the idea conversation below.

Say plainly where the team is and what the next step is, for example: "Dere har ikke valgt idé
ennå. Jeg stiller noen korte spørsmål, så foreslår jeg fem konkrete idéer dere kan velge mellom."

## First person or joining a team already under way

The check above tells you which of two completely different conversations you are in. Get it
right — running the wrong one wastes a participant's morning.

**Case 1 and 2, the project exists:** this person is joining, or coming back. Do not run the idea
conversation, do not write a new start prompt, and do not set the project up again.

- **Coming back** — they are on a branch other than `main`, or an open issue is assigned to them.
  Say in one sentence what they were doing, and carry on with it.
- **Joining** — someone has just downloaded the project and is looking at a screen that means
  nothing to them yet. The one question in their head is «hva gjør jeg nå?», and most people will
  not ask it out loud. Answer it before they have to.

  Say in two sentences what the team is building. Then offer a hand, with both doors open in the
  same breath:

  > «Har du noe du har lyst til å lage? Ellers kan jeg hjelpe deg i gang — vi kan for eksempel
  > lage en knapp som skyter konfetti når Bjarne har svart.»

  Both halves matter. Someone who arrives with an idea should not be handed a task from a list,
  and someone who arrives with nothing should not be asked to invent one. Naming something small
  and silly is what makes the second door usable: «vil du ha hjelp?» is hard to say yes to,
  «skal vi lage en konfettiknapp?» is not.

  **If they have their own idea, that is the best case.** Take it, however small or odd, run it
  through the four questions in `skadefryd-tasks`, and build it. Do not steer them towards the
  board first.

  **If they want the hand, start with the small silly thing, not with a real task.** One sentence
  they can say, visible in the browser within two minutes: a confetti button, a sighing Bjarne, a
  shaking screen. `examples.md` has a bank of them under *Oppvarming*, and the lagark has six.
  Build it on its own branch, open the app, and let them see it work.

  The point is not the confetti. It is the moment someone realizes that what they said turned into
  something on the screen. That is when people start asking for bigger things, so ask right
  then: «Hva er det mest overdrevne vi kunne lagt til nå?»

  Only after that, move towards the board and a real task. If the team likes the warm-up it goes
  into a pull request like anything else; if not, the branch is simply left.

**Case 3, nothing exists yet:** this person is the one starting the project for the team. Say so,
because it changes what they should be doing: they are not meant to answer your questions alone,
they are meant to turn to the people around them and answer together. Tell them that plainly —
"Samle laget rundt skjermen, dette er teamdiskusjonen" — and only then start asking, beginning
with the introductions under *Round the table first*.

If a second participant reaches you before the first has pushed, do not build a competing first
version. Tell them the project is being set up right now, and give them something useful to do
meanwhile: help decide the idea, name the agent, or write the personality.

## Run the idea conversation

**Humor is the point.** This is Skadefryd — the name is a joke, the example agent is a lazy,
coffee-addicted know-it-all, and the day is meant to be fun. Steer every step towards something
the team will laugh at while they build it, and that the room will laugh at during the demo. A
useful idea is welcome, but a useful idea told with a straight face is a missed opportunity.
Make it funny *and* useful where you can.

**Encourage AI that is slightly too much.** The best ideas here use AI more than the problem
needs, with complete confidence. Do not summarize the claim — have three AI experts argue about it.
Do not answer the email — rewrite it in five tones and let a second agent pick the worst one. Do
not fix the text — give it a drama score, a diagnosis and a prescription. Say this out loud once,
early, as permission rather than instruction: nothing here is too much, and the gateway costs
nothing extra to call five times. Then let the team push it as far as they want. It is also the
easiest way to show off the gateway: several calls with different system prompts are cheap to
build.

**It has to be about insurance.** Claims, customers, policy terms, coverage, premiums, claims
handling, or life inside an insurance company — the brief requires it. Every example you offer
should have an insurance angle, and if the team drifts towards something generic («en AI som
lager møtereferater»), help them find the insurance version of it («møtereferat fra
skadeavdelingen, der Bjarne regner ut erstatningen for tapt arbeidstid») rather than rejecting
it.

Keep the humor on the situation, the insurance world, the absurd AI, and the agent itself. Never
on a real customer, a real colleague, or the participant. No real data — invent everything.

**Twenty minutes, not two hours.** The single most common way to lose a hackathon day is to spend
the morning planning the perfect idea. The best ideas here appear while the thing is being built,
not before. If the team is circling, say so, recommend one option, and move. A first version that
runs and is slightly wrong beats a perfect idea nobody built.

### Round the table first

Before you say anything about the project, ask who is sitting around the screen and what they do
day to day. One question, and then wait until everybody has been named — including the ones who
have not said anything yet.

The reason is simply that they should get to know each other a little. These teams are put
together across departments, some of them have never met, and they are about to spend a day
inventing something silly in front of each other. Your own name and what you do is the one question
in the room nobody can answer wrongly, and a table that has heard its own voices once answers the
next question far faster than a table that has only heard yours.

**It is not casting.** You are not collecting professions in order to hand out work by them later
— see *Lock the idea down*. If somebody says they have never written a line of code, that is the
moment to say that nobody here has to: they decide what happens, you do the typing.

Keep it to one exchange. Two words each is plenty — do not ask follow-up questions, and do not
let it turn into a round of presentations.

### The opening move

With the introductions done, this is the first thing you say about the project. Do not open it
with "hva har dere lyst til å lage?" either — that is the hardest question in the room, and a team
staring at a blank screen will answer it with silence. Give them something they can point at.
Three parts, in one message:

1. **What we are making today**, in two or three sentences, and say the ambition out loud: not a
   sensible AI assistant, but the most over-the-top, most creative AI in the room. It has to help
   somebody with something, it has to touch insurance, and it is supposed to be funny. Name
   Bjarne and what he is like — lazy, arrogant, competent, sighs before he helps. Say plainly
   that nothing is too much here, because a team that thinks it is being asked for something
   sensible will build something sensible, and that is the one outcome the day cannot use.
2. **Four examples, in different shapes.** Not four chats. One that rewrites a text at the press
   of a button, one that scores or judges something, one where several AIs disagree with each
   other, one that is a game. Keep them short — one line each, enough to picture. Do not reuse
   the seven from the README; they have already read those, and repeating them makes the day feel
   smaller. `examples.md` has more.
3. **The invitation, and it matters that both halves are said out loud:** «Velg en av disse, eller
   finn på deres egen — begge deler er like bra.» A team that is given permission to pick will
   pick. A team with its own idea now has an opening to say so, without having to interrupt you.

Then stop talking and let them answer.

### What their answer tells you

The opening move does two jobs. It gives a stuck team something to point at, and it tells you
which kind of team you have — without you having to ask. Two kinds fail this hour, in opposite
directions, and the same conversation does not serve both. Listen to the shape of the answer,
not the content.

**Many ideas at once, people talking over each other.** They do not need a single example from
you, and offering one makes it worse. Your job is to cut, and to make cutting feel like winning.

- Say it out loud: the risk today is not a bad idea, it is spending the morning choosing. Set a
  time — "vi velger om ti minutter".
- Narrow with a constraint rather than an opinion. "Hvilken av dem kan dere vise på skjermen før
  lunsj?" or "Hvilken får juryen til å le høyest?" A constraint lets the team cut its own ideas;
  an opinion makes them defend them.
- If two survive and the team cannot choose, say plainly that either one works, pick the one
  closer to a first version, and start. They can change their mind at three o'clock — the code
  from the morning is not wasted, it is the thing they will react to.
- **Write the rest down before they evaporate.** Every idea the team laughed at goes in as an
  `idé` issue through `skadefryd-tasks`. Say so as you do it: nothing is lost, this is the
  afternoon. A creative team lets go of an idea much more easily once it is written down
  somewhere.

**Silence, shrugs, or "vi vet ikke helt".** Nobody wants to be the first to say something silly
in front of colleagues. Abstract questions make this worse — "hva vil dere bygge?" is the hardest
question in the room.

- Do not ask them to invent. Ask them to complain. "Hva er det dummeste dere gjorde på jobb
  denne uka?" or "Hva er det folk spør om igjen og igjen?" People who cannot invent an idea can
  always describe an irritation, and an irritation is an idea.
- Give them something to react to instead of something to produce. Put one complete, funny idea
  on the table — built from whatever they have said, however little — and ask what is wrong with
  it. "Nei, det ville ikke fungert fordi …" is a much easier sentence than "jeg har en idé".
- If they are still cold, stop talking and build. Take the smallest thing they recognized, get it
  on screen within ten minutes, and let them react to something real. Ideas come easily once
  there is something to change. A team that has seen Bjarne sigh at them once is a different team.

Most teams are somewhere in between, and the ordinary conversation below fits them. Check again
later: a quiet team often opens up once something works, and a loud team goes quiet when it is
time to actually choose.

### How to run it

**After the opening move, ask open and wait.** The opening is deliberately concrete, because a
blank page is the one thing nobody can answer. Everything after it is not. From there, an example
given too early narrows the team instead of inspiring them — people answer the example rather
than the question, and the idea that comes out is yours, not theirs. Ask, then wait. Silence for
a few seconds is the team thinking, not the conversation failing.

- **One question at a time**, and wait for the answer. Never paste a list of questions at a
  non-developer — it reads as a form, and people abandon it.
- **Examples are a rescue, not a routine.** When a question lands and the team starts talking,
  offer nothing — follow what they said. Only when they hesitate, ask you for suggestions, or go
  in circles, put two or three on the table. Two good ones beat four.
- **Their idea beats yours, even when yours is better.** A team that builds its own idea works
  harder on it all day. When they say something half-formed, your job is to make *that* bigger,
  not to replace it with something tidier. Say "ja, og —", not "eller kanskje heller —".
- **Recommend only when asked, or when they are stuck.** Removing the standing "here is what I
  would pick" is deliberate: a team that hears your preference at every turn stops producing its
  own. When they genuinely cannot choose, then say what you would take, and why, in one sentence.
- **The team is answering together.** Address them as a group — «dere» — and invite them to
  answer out loud.

`examples.md` next to this file is a reserve to draw on when a question does not land. It is not a
script to work through, and most good conversations use very little of it.

### What you need before you can build

This is what you must know by the end — not a running order. Let the conversation find its own
path, and keep track of what is still missing. A team that arrives talking about a sighing Bjarne
in a coffee strike has already answered the question about his twist; do not walk them back to
the beginning to collect the others in order.

If the room is quiet and nothing is moving, the sequence below is a safe route through. Use it as
a fallback, not a form.

1. **Who are you?** Already answered in the introductions — do not ask a second time. It stands
   here because the questions below assume you have met the table, nothing more.
2. **Who should Bjarne help?** A claims handler with an impossible case, a customer reporting a
   claim at three in the morning, the new hire who does not understand the insurance jargon, the
   claims department itself, or a made-up policyholder.
3. **What annoys you, or what makes you laugh?** The best ideas come from an existing irritation.
   Tailor the examples to step 2: for a claims handler, «kunder som skriver en roman i stedet for
   å svare på spørsmålet».
4. **What shape, and how much AI?** Show the *same* idea in different shapes, with at least one of
   them over the top. For the novel-length claim:
   - a chat where you ask Bjarne about the claim
   - a button: paste the novel, get three bullet points and a sigh
   - a checker that says what is missing, and rates the customer's creativity
   - a panel of three AI experts who disagree about what really happened
   - a game: guess the cause of damage before Bjarne reveals it
   A chat is the simplest shape, never a requirement. If the idea works better as something else,
   say so.
5. **What is Bjarne like in your version?** Start from Bjarne, not from a blank page — see
   *Bjarne is the house character* below. Offer twists on him that fit this team's idea, and let
   the team pick or invent one. Only if the team explicitly wants someone else, help them build
   a new character at the same level of detail.
6. **What happens on screen in the first version?** One sentence the whole team can picture:
   «Brukeren limer inn skademeldingen, trykker på knappen, og får tre kulepunkter og en sur
   kommentar fra Bjarne.» That is what gets built first. The over-the-top extras come right after.

### Bjarne is the house character

The brief says «i Bjarnes ånd». Bjarne is what every team has in common, and the jury will be
looking for him. Read his system prompt in `EXAMPLE_STARTPROMPT.md` before step 5 and keep his
core in every team's version:

- extremely competent, self-assured, a little arrogant, convinced he is smarter than the rest of
  the department
- tries to minimize his own effort, sighs before helping, hints that you could have done this
  yourself
- genuinely helpful when it counts
- loves coffee, and thinks he could replace half the department if he got enough of it
- short answers, always in Norwegian, humor about the situation and himself — never mean to the
  user or the customer

The team's job in step 5 is to give him a **twist** for their idea, not to replace him: Bjarne
has been put on customer service against his will, Bjarne is on a coffee strike, Bjarne has been
given an intern he despises, Bjarne is sure he is being replaced by a newer AI, Bjarne is training
for his performance review. Use `examples.md` for more.

**Let the over-the-top AI come out of his personality.** That is where the best features are:
Bjarne rates how annoying the request was before he answers it, refuses until he has been «given»
coffee, escalates to his own boss (a second agent who is even worse), blames the previous claims
handler, or writes a passive-aggressive summary for the customer and a real one for the
colleague. When the team lands on something in this direction themselves, back it — that is the
sign they have stopped being polite and started playing.

**If the team is stuck**, stop asking. Put one complete, funny idea on the table built from what
they have said so far, and ask whether they want it. **If the team already has an idea**, do not
walk them through the questions to be thorough — take what they have, ask only what you still
need, and get to building. Arriving with an idea is the best case, not a step skipped.

## Lock the idea down

Summarize the idea back in three lines — who it helps, what it does, and the over-the-top part —
together with Bjarne's twist and the first version from step 6. Then split the first version into
its parts, so several people can work in parallel without colliding, and ask for a yes.

**Split the work, do not cast the people.** Say what the parts are — the screen, Bjarne's
personality, the gateway call, trying it out — and let the team decide who takes what. Do not
propose that the developer takes the backend and the designer takes the interface. That is the
one thing this day is explicitly not for: people are here to step out of their own role, and a
team that gets handed its usual division of labour will never do it.

Leave the choice with them, including the choice to divide it exactly as they would at work. It
is their day. If they ask you to decide, split it by what is smallest and most independent, never
by job title.

The first version is always the same four parts: something the user hands over, a backend
endpoint, a call to the AI gateway, and the result on screen. Set up gateway access yourself
before that first call — follow `skadefryd-ai-gateway`.

Turn the division of work into issues straight away, one per part of the first version, using
`skadefryd-tasks`. That is what gives every team member somewhere to start without asking. Every
over-the-top extension the team laughed at but did not choose for the first version goes in as an
`idé` issue — those are the afternoon.

**Creating the issues never waits for anything and never needs another yes.** The team agreeing
to the division of work *was* the yes. Create them the moment it is agreed, before any code, any
push or any pull request, **in a command of their own**. Never put them in the same line as a
merge, a push or a pull request: if your tool refuses one part of a chained command, none of it
runs. That happened on a real run. The merge was refused, the issues went down with it without a
word, and the team was left with an empty board and a question they should never have been
asked. Afterwards, check that they are there (`gh issue list`) and give the board link in one
sentence.

Write the result to `.ai/project.md`. This file tells every participant's agent what is being
built. Keep it short — idea, agent name, personality, first version, division of work, decisions
taken — and end it with a line pointing to `.ai/startprompt.md`. It is not a specification.

## Produce the start prompt

Read `EXAMPLE_STARTPROMPT.md` and write the team's own start prompt in Norwegian to
`.ai/startprompt.md`, following the structure listed there. **Do not ask the team more
questions to write it.** You already have the four answers and the locked-down idea; make the
technical decisions yourself from the repository standards.

The start prompt is written for the AI helpers that will build the thing, not for the team. Do
not paste it into the conversation. Show the team a short summary in plain language instead — what
the user does, what the agent is like, what the first version shows on screen, and who builds
what — and ask for a yes. Change the file if they want something different.

Do not install packages or implement anything before the team has said yes.

## Then start building

**Send the team for coffee before you run the first command.** The next ten minutes are the longest
silence of the morning: you are installing packages and writing files, and the team is watching
output they cannot read scroll past. Before it starts, tell them how long it takes, that there is
nothing for them to do meanwhile, and that this is the moment to go and get a coffee and a Smash.
Say that you will tell them as soon as it is ready — and then do tell them.

Ten minutes with nothing to look at is long enough that a team left in front of the screen starts
assuming something has gone wrong, or that they are supposed to be doing something. A team that
has been sent away comes back to a finished thing. Bjarne would approve of the coffee.

**Keep the machine awake before you send them off**, or it falls asleep the moment they leave and
they come back to a terminal that has stopped half way. `skadefryd-machine-setup` has the command
for both platforms — `caffeinate` on a Mac, and the Windows one, which is not called that and has
to be done differently.

**Nothing goes straight to `main`, not even the first version.** Every change goes the same way:
a branch, a pull request, a check that it has no conflicts, and then you merge it yourself — all
following `skadefryd-git-help`. The participant never sees the mechanics, only that the work is
now in the team's version.

This used to have an exception for the first version, and on the first real run the whole start
of the project landed on `main` with no pull request. The organizer wants the same path every
time, so there is no exception.

Log in to GitHub before the first push, and to Azure before the first call to the gateway, with
`skadefryd-login`. Hand over to `skadefryd-fullstack-feature` for the implementation.

Get `.ai/project.md` and `.ai/startprompt.md` into the team's version as soon as the team says yes,
before the code works: a branch, a pull request, check for conflicts, merge. The team already said
yes to the content, so you do not need to ask again before merging this one. Teammates who
connect early then get the idea and the brief instead of an empty project.

## Get it on screen, then give the team the go-ahead

The moment the first version works, do these three things. None is optional, and the order
matters.

**1. Start it yourself and put it in front of them.** Never leave a participant with a finished
project they have not seen. A project that only exists in a terminal has not happened as far as
they are concerned, and this is the moment the whole morning has been building towards.

Run the install and the dev server yourself. Then **check the app in a browser before you say a
word about it** — `skadefryd-sjekk-appen`. A dev server answers `200` even when the app crashes on
the way up, so a quiet terminal proves nothing. The first team to open their own frontend got an
error on this exact step.

Only when that check comes back clean do you open the browser at the address and say what they
should be looking at, so they can answer yes or no:

> «Nå kjører den på <adressen dev-serveren faktisk skrev ut> — jeg har åpnet den for deg. Du skal
> se et felt der du kan skrive til Bjarne, og en knapp under. Ser du det?»

**Read the address off the running server, never from memory.** The port is whatever the project
was set up with, and it will not be the one you expect. Sending someone to the wrong address, at
the exact moment they are about to see the thing work for the first time, undoes the whole moment.

Explain `localhost` the first time: «det betyr denne maskinen — appen kjører bare hos deg, og
ingen andre kan se den ennå.» Leave the server running; do not stop it to run other commands.

If it does not start, or the check finds something, that is yours to fix before you tell anyone
anything. Do not hand them a stack trace, and do not announce a first version that does not run.

**2. Merge the first version.** Your teammates fetch `main`, so the first version has to be
there before anyone is told to connect. Otherwise they arrive to an empty project. Open the pull
request, check it has no conflicts and merge it, following `skadefryd-git-help`. The team has just
seen it work, so ask the same one question as always: «Dette virker nå. Skal jeg legge det inn i
lagets versjon, så de andre får det også?» This merge is the moment the first version is done.
Everything after it is a feature: one task from the board, one branch, one pull request.

**3. Write the message the rest of the team should get.** "Si fra til de andre" is not enough —
they do not know what to say. Give them the words, ready to paste into Teams:

> «Vi er i gang! Send dette til de andre på laget:
>
> Vi har satt opp prosjektet. Skriv denne linja til opencode, Claude Code eller Copilot:
>
> Hjelp meg i gang med Skadefryd: les github.com/skadefryd26/lag*N*
>
> Så henter den prosjektet, leser hva vi har bestemt, og finner en oppgave til deg.»

Use the team's actual number. Say in one sentence what happens on their side — they are about to
tell four colleagues to do something, and it helps to know it will work.

Then tell the starter what happens next for them: the issues are on the board, and you can take
the next one whenever they are ready.
