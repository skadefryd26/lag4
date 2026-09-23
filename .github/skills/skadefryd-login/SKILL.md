---
name: skadefryd-login
description: 'Read before logging a Skadefryd 2026 participant in to GitHub (gh auth login) or Azure (az login), before the first push, before the first call to the AI gateway, or when a command fails with "not logged in", "authentication required", "gh auth login", "Please run az login", AADSTS, or a 403 on push. You start the login yourself; the participant only approves it in the browser. Also covers the invitation to join the team.'
---

# Skadefryd Login

The participant never types in a terminal. Not for installing, not for Git, and not for logging
in. Many of them have never opened one, and some have just asked what GitHub actually is.

Two logins are needed during the day, and both need the participant's own identity. You still
run them. **You start the login, the participant approves it in the browser, you carry on.**

| Login | Needed for | When |
| --- | --- | --- |
| GitHub (`gh`) | Pushing, pull requests, tasks | Before the first push or the first task |
| Azure (`az`) | The AI gateway token | Before the first call to the gateway |

Do each one when it is needed, not both up front. A participant who has to approve two logins
before seeing anything happen has had a bad first ten minutes.

**Not for getting the project, either.** The team repository is public, so `git clone` over https
needs no credentials at all. Starting `gh auth login` in order to download it is the wrong move
twice over: it is not needed, and it puts a login in front of the very first thing that was
supposed to happen. It happened on the first real run — the participant was taken through a
device code before a single file had been downloaded, got stuck, and had to work out how to skip
past it on her own. Clone first. Log in when there is something to push.

## Check first

Never start a login that is not needed. Both tools can tell you:

```bash
gh auth status          # exit code 0 = logged in
az account show         # exit code 0 = logged in
```

If `gh` or `az` is missing, install it first — `skadefryd-machine-setup`. On Windows, use the full
path from `.ai/user-profile.md` if the short name is not on PATH in your session yet.

## These commands wait for the participant

Both logins block until the participant has approved in the browser. That can take a couple of
minutes, and **most agent tools kill a command after about two minutes.** A killed login is a
failed login, and the participant approves in the browser for nothing.

Run the login with the longest timeout your tool allows, at least five minutes, or in the
background if your tool supports that. Then check with the status command above. If your tool
cannot do either, run it in the background yourself and write the output to a file:

```bash
nohup gh auth login --hostname github.com --git-protocol https --web --skip-ssh-key > "$HOME/.skadefryd-login.log" 2>&1 &
```

```powershell
Start-Process -NoNewWindow -FilePath $gh -ArgumentList 'auth','login','--hostname','github.com','--git-protocol','https','--web','--skip-ssh-key' -RedirectStandardError "$env:USERPROFILE\.skadefryd-login.log"
```

`gh` writes the code to stderr. Read it from the log file.

## GitHub

```bash
gh auth login --hostname github.com --git-protocol https --web --skip-ssh-key
```

Without a terminal attached, it does not ask any questions. It prints two lines and waits:

```
! First copy your one-time code: ABCD-1234
Open this URL to continue in your web browser: https://github.com/login/device
```

**Do not hand them the code to copy out of the chat.** Selecting a code in a chat window, finding
the browser, finding the field and pasting it is four steps, and it is the step of the day where
non-developers get stuck.

GitHub does **not** fill in the code from the link. `?user_code=` in the address is ignored and the
page opens with empty boxes. That was tested on 22 September 2026, so do not rely on it.

Instead, put the code on the clipboard yourself, then open the page:

```bash
printf 'ABCD-1234' | pbcopy                       # macOS
open "https://github.com/login/device"
```

```powershell
Set-Clipboard -Value 'ABCD-1234'                  # Windows
Start-Process "https://github.com/login/device"
```

Now the participant only has to paste. Take them through it **one screen at a time**: send one
step, wait for them to say it is done, then send the next. Never all three at once.

**Step 1**, sent together with opening the page:

> Nå kobler vi deg til GitHub, så arbeidet ditt kan lagres. Jeg har åpnet en side i nettleseren
> og kopiert koden for deg.
>
> Klikk i den første ruta og trykk **⌘V** (på Windows: **Ctrl+V**). Si fra når koden står der.

Adjust the key to the machine you are on. Only mention the other one if you do not know.

**Step 2**, when they say the code is there:

> Fint. Trykk **Continue**.

**Step 3**, when the next page is up:

> Trykk den grønne knappen **Authorize github**. Si fra når det står at du er ferdig.

If something is off, handle only that, calmly, and then carry on from the step you were on:

- **The boxes stayed empty after pasting.** Give them the code, alone on its own line, and ask them
  to type it: «Da skriver vi den inn for hånd. Koden er: **ABCD-1234**»
- **GitHub asks them to sign in first.** That comes before the boxes. «Logg inn på GitHub først,
  så kommer rutene.» If they have no account, see *No GitHub account* below.
- **They cannot find the browser window.** It is a new tab in the browser they already had open,
  not a new program.

Then wait. When they say it is done, run the next two commands yourself:

```bash
gh auth status
gh auth setup-git
```

`gh auth setup-git` makes plain `git push` use the same login. Without it, the first push asks
for a password in a terminal the participant cannot see, and hangs.

### Check that they are on the team

The organizers invite every participant to the `skadefryd26` organization by work email, straight
into a team called `lag<N>` that can push to the team repository. The participant accepts by
clicking the link in that email, and can do it with any GitHub account — often a private one that
is not tied to the work email at all. That is fine.

Check right after the login:

```bash
gh api user/memberships/orgs/skadefryd26 --jq .state
```

- **`active`** — they are in. Carry on.
- **`pending`** — the invitation is tied to this account but not accepted. Accept it for them with
  `gh api -X PATCH user/memberships/orgs/skadefryd26 -f state=active`, and say so in one sentence.
- **`404` / not found** — this account has not accepted the email invitation. Ask them to find it:

> Du har fått en e-post fra GitHub på jobbadressen din, med emnet «… invited you to join the
> skadefryd26 organization». Åpne den, trykk den grønne knappen **Join @skadefryd26**, og logg
> inn med den samme GitHub-kontoen du nettopp brukte. Si «ferdig» her når det er gjort.

Then check again. If they cannot find the email, it is an organizer problem, not theirs: tell
them to ask an organizer to send the invitation again, and keep working locally in the meantime.
Nothing is lost — the work can be pushed later.

If pushing fails with `403` or `Permission denied` even though the state is `active`, they are
probably on the wrong team. Say which team you expected (`lag<N>`) and send them to an organizer.

### No GitHub account

If the participant does not have a GitHub account, the browser page asks them to create one. That
is fine. Tell them to choose **Sign up**, use their work email, and come back when they are in.
Explain in one sentence what GitHub is if they ask: "GitHub er stedet der laget lagrer koden sin,
sånn at alle jobber på samme prosjekt."

## Azure

```bash
az config set core.login_experience_v2=off
az login
```

The first line switches off a subscription picker that otherwise asks a question in a terminal
nobody is looking at. `az login` opens the browser by itself and waits. Tell the participant what
is about to appear:

> Nå åpner nettleseren seg og spør hvem du er. Det er for at laget ditt skal få snakke med
> Gjensidiges AI.
>
> 1. Velg Gjensidige-kontoen din.
> 2. Når nettleseren sier at du er logget inn, kan du lukke fanen og si «ferdig» her.

If the browser never opens, or it is on a machine where it cannot, use the code variant:

```bash
az login --use-device-code
```

It prints a code and `https://microsoft.com/devicelogin`. Send it the same way as the GitHub code.

Check with `az account show`. If the token fetch in `skadefryd-ai-gateway` then fails with a
subscription or tenant error, select the right one yourself:

```bash
az account set --subscription "Gjensidige Production Modern"
```

The Azure login lasts the day. The token made from it expires after about an hour, and that you
refresh yourself without involving the participant. See `skadefryd-ai-gateway`.

## How to talk while they do it

- **Tell them what they will see before they see it.** A login page that appears out of nowhere
  looks like something went wrong.
- **One thing at a time.** Send the code and the link, then wait. Do not do other work and answer
  their «ferdig» three paragraphs later.
- **Never ask for a password, a token, or a code they received.** They type those into the
  browser, never into the chat. If they paste one here anyway, say so, and do not repeat it back.
- **Never say "just" or "simply".** When it does not work, those words tell the person the problem
  is them.
- **Never send them to a terminal.** If a login cannot be done this way, find another way or get a
  developer on the team to help. Do not give a non-developer a command to type.

## When it fails

- **The code has expired.** The GitHub code lasts about fifteen minutes. Start the login again and
  send the new code.
- **"The device code has already been used" or the login finishes but `gh auth status` says no**
  — start again. It costs one minute.
- **The Azure page says the account is not allowed, or `AADSTS` errors** — often the wrong account
  was chosen in the browser. Run `az logout`, then `az login` again, and tell them which account
  to pick.
- **A company policy blocks the device-code page** — use the variant that opens the browser
  instead of the code variant, or the other way round.

If two attempts do not fix it, stop. Say plainly that this one needs an organizer or a developer
on the team, and keep the participant working on something that does not need the login in the
meantime: the idea, the agent's personality, the text on the screen. A non-developer who spends
twenty minutes on a login has lost the part of the day they came for.
