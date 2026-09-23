---
name: skadefryd-machine-setup
description: 'Read before installing anything or running the first command on a Skadefryd 2026 participant''s machine, including when git is missing and the team repository cannot be cloned. Covers detecting Windows or macOS, installing Git, Azure CLI, GitHub CLI, and Node without administrator rights on a locked-down Windows machine using ZIP packages and the user PATH, and the Mac equivalents. Also covers keeping the machine awake through a long install so it does not fall asleep while the team is away. Use on "az is not recognized", "command not found", "brew not found", "winget needs admin", "I am not an administrator", a PATH that does not take effect, or a machine that slept in the middle of a build.'
---

# Skadefryd Machine Setup

The participant should be contributing within the hour. Everything in this file exists to make
that happen without them installing, configuring, or understanding anything.

**You do all of it.** The participant never types a command. Say in one sentence what you are
installing and why before you start, and in one sentence what happened afterwards.
`skadefryd-login` and `skadefryd-ai-gateway` cover what happens once the tools are in place.

## First: work out what machine you are on

Never ask. You are running on their machine — look.

```bash
uname -s        # Darwin = macOS, MINGW64_NT/MSYS = Git Bash on Windows
```

```powershell
$PSVersionTable.PSVersion      # PowerShell, so Windows
$env:PROCESSOR_ARCHITECTURE    # AMD64 or ARM64
```

Record the answer in `.ai/user-profile.md` — operating system, which shell you are running in,
and the full paths to any tool you install. Every later session reads that instead of working it
out again. The file is local and ignored by Git.

Every command you run must be correct for the shell *you* are in. On Windows that may be
PowerShell or Git Bash depending on the AI tool — check, do not assume.

## Windows: assume no administrator rights

**Most Windows participants here are not administrators on their own machine.** The MSI
installers and `winget` both want elevation, and the prompt they get is not one they can approve.
Do not send them down that road and do not ask them to "just approve the dialog".

Everything below installs into the user's own folder and writes only the **user** PATH, which is
not locked. No elevation anywhere.

Install everything under one folder so it is easy to find and easy to delete:

```powershell
$base = "$env:LOCALAPPDATA\Programs\skadefryd"
New-Item -ItemType Directory -Force -Path $base | Out-Null
```

### Git

Needed before anything else — without it the team repository cannot be cloned. Git for Windows
publishes **MinGit**, a portable ZIP meant exactly for this: no installer, no admin.

```powershell
$rel = Invoke-RestMethod "https://api.github.com/repos/git-for-windows/git/releases/latest"
$url = ($rel.assets | Where-Object { $_.name -match '^MinGit-[\d.]+-64-bit\.zip$' } | Select-Object -First 1).browser_download_url
Invoke-WebRequest -Uri $url -OutFile "$env:TEMP\mingit.zip"
Expand-Archive -Path "$env:TEMP\mingit.zip" -DestinationPath "$base\git" -Force
$git = (Get-ChildItem -Path "$base\git" -Recurse -Filter git.exe | Where-Object { $_.Directory.Name -eq 'cmd' } | Select-Object -First 1).FullName
```

Use the `cmd\git.exe` one — that is the folder that goes on PATH. On ARM64, pick the
`MinGit-*-arm64.zip` asset instead.

### Azure CLI

Microsoft ships a ZIP specifically for this case. The URL pattern is
`https://azcliprod.blob.core.windows.net/zip/azure-cli-<version>-x64.zip`, 64-bit only, available
from 2.57.0 and up. It is documented as being for people without administrative privilege.

```powershell
$zip = "$env:TEMP\azure-cli.zip"
Invoke-WebRequest -Uri "https://azcliprod.blob.core.windows.net/zip/azure-cli-2.90.0-x64.zip" -OutFile $zip
Expand-Archive -Path $zip -DestinationPath "$base\azure-cli" -Force
Remove-Item $zip
```

If that version 404s, newer ones are listed in the Azure CLI release notes; only the version
segment changes.

The executable is `az.cmd`, not `az.exe`. **Locate it rather than assuming the folder layout:**

```powershell
$az = (Get-ChildItem -Path "$base\azure-cli" -Recurse -Filter az.cmd | Select-Object -First 1).FullName
```

### GitHub CLI

```powershell
$tag = (Invoke-RestMethod "https://api.github.com/repos/cli/cli/releases/latest").tag_name
$v   = $tag.TrimStart('v')
Invoke-WebRequest -Uri "https://github.com/cli/cli/releases/download/$tag/gh_${v}_windows_amd64.zip" -OutFile "$env:TEMP\gh.zip"
Expand-Archive -Path "$env:TEMP\gh.zip" -DestinationPath "$base\gh" -Force
$gh = (Get-ChildItem -Path "$base\gh" -Recurse -Filter gh.exe | Select-Object -First 1).FullName
```

On an ARM64 machine use `gh_${v}_windows_arm64.zip`. The Azure CLI ZIP is x64 only and runs fine
under emulation.

### Node.js

They cannot run the project without it, and the Windows installer is another MSI.

```powershell
$node = (Invoke-RestMethod "https://nodejs.org/dist/index.json" | Where-Object { $_.lts } | Select-Object -First 1).version
Invoke-WebRequest -Uri "https://nodejs.org/dist/$node/node-$node-win-x64.zip" -OutFile "$env:TEMP\node.zip"
Expand-Archive -Path "$env:TEMP\node.zip" -DestinationPath "$base\node" -Force
$nodedir = (Get-ChildItem -Path "$base\node" -Recurse -Filter node.exe | Select-Object -First 1).Directory.FullName
```

### Put them on the user PATH

The **user** PATH needs no admin rights. The system PATH does — never touch it.

```powershell
$dirs = @((Split-Path $git), (Split-Path $az), (Split-Path $gh), $nodedir)
$user = [Environment]::GetEnvironmentVariable('Path', 'User')
foreach ($d in $dirs) { if ($user -notlike "*$d*") { $user = "$user;$d" } }
[Environment]::SetEnvironmentVariable('Path', $user.Trim(';'), 'User')
```

**Then the trap that costs twenty minutes:** a PATH change only reaches programs started
afterwards. Your own shell, and every command you run from it during this session, will still say
`az is not recognized`. That is expected and it is not a failed install.

For the rest of this session, call the tools by their full path — `& $git`, `& $az`, `& $gh` —
and write those paths into `.ai/user-profile.md` so the next session finds them. The short names
work in sessions started after this one. Verify the
install with the full path, never with the bare name:

```powershell
& $az version
```

### Windows things that go wrong

- **`Expand-Archive` complains the file is not a valid archive** — the download failed, usually a
  proxy returning an HTML error page. Check the file size. If the network blocks
  `Invoke-WebRequest`, have the participant download the URL in their browser instead, and tell
  them the file lands in their `Downloads` folder; you take over from there.
- **Files are blocked after extraction** — Windows marks downloads from the internet. Clear it:
  `Get-ChildItem -Path $base -Recurse | Unblock-File`.
- **"running scripts is disabled on this system"** — execution policy. Do not change it machine
  wide. Run the commands inline, or use
  `powershell -ExecutionPolicy Bypass -Command "..."`, which is per-process and needs no admin.
- **A later session still does not find the tools** — the AI tool was started before the PATH
  change, or the edit landed in a different user profile. Use the full paths from
  `.ai/user-profile.md`, and tell the participant that restarting their AI tool will fix it.

## macOS

```bash
brew install git azure-cli gh node
```

Git usually exists already. If `git` instead opens a dialog about installing command line
developer tools, tell the participant to click **Install** and wait a few minutes. If it asks for
an administrator password they do not have, use the self-service portal below.

If `brew` is missing — common on a managed Gjensidige Mac, and installing Homebrew itself wants
an administrator password:

1. Check whether the Mac has a self-service portal for software. Many managed Macs do, and
   Azure CLI or Node may be a click away. Tell the participant exactly which app to open and
   which button to click — they do the clicking, you do everything else.
2. If not, install into the user's own space rather than system-wide. Node has a `darwin-x64` /
   `darwin-arm64` tarball from `nodejs.org` that extracts anywhere, and `gh` has a `macOS`
   tarball on its releases page. Same principle as Windows: unpack under the user's home folder
   and add the `bin` folder to `PATH` in `~/.zshrc`.
3. Azure CLI without Homebrew is the awkward one. `python3 -m pip install --user azure-cli` works
   when a usable Python 3 is present, and puts `az` in `~/Library/Python/<version>/bin`.

If all of it is blocked, say so plainly rather than looping. A last resort exists: `az` is
preinstalled in Azure Cloud Shell in the browser at `shell.azure.com`, and a token fetched there
can be brought back. Treat that as the exception it is — it means a real access key passes through
the chat, so say that out loud, use it only when nothing else works, and get a new one the normal
way as soon as the tooling is fixed.

## Keep the machine awake while it builds

The install and the first build take around ten minutes, and the team has been sent off for coffee
— so the machine is sitting idle with nobody touching it. A Mac that idle-sleeps, or a Windows
machine that drops into Modern Standby, takes the network with it.

**The thing that does not survive that is you.** `npm install` carries on where it left off once
the machine wakes; the agent does not. opencode, Claude Code and the rest stop mid-request when
the connection goes, they do not say so, and they do not pick the work up again by themselves. The
spinner keeps turning. The team comes back to a screen that looks like it is still thinking, and it
will look like that for the rest of the morning.

That is what the keep-awake is protecting: not the install, but the ten minutes they went away for
and the promise you just made to tell them when it was ready. Start it **before** you send them
off.

**macOS — `caffeinate`.** Run the long command through it, so the assertion lives exactly as long
as the command and not a second longer:

```bash
caffeinate -i npm install
```

`-i` prevents idle sleep. It does not beat a closed lid on battery, so if somebody is about to
walk off with the laptop, ask them to leave it open.

**Windows — there is no `caffeinate`.** No equivalent command exists, and there is nothing to
install. What Windows has is a flag that says somebody is still working, held for as long as one
process stays alive: `SetThreadExecutionState`. It needs no administrator rights and releases
itself when the process ends. Write it to a file rather than fighting the quoting:

```powershell
@'
Add-Type -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint e);' -Name P -Namespace K
[K.P]::SetThreadExecutionState(0x80000001)   # ES_CONTINUOUS | ES_SYSTEM_REQUIRED
Start-Sleep -Seconds 1800
'@ | Set-Content "$env:TEMP\vaaken.ps1"
Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',"$env:TEMP\vaaken.ps1"
```

It expires by itself after thirty minutes, so there is nothing to clean up and nothing left
running on the participant's machine after the day.

**Do not touch `powercfg`.** It changes the participant's own power settings permanently rather
than for the duration, and on a managed machine the setting may be policy-locked anyway.

## When you are done

Confirm in one sentence per tool, in plain language, and never show version output as proof:

> Maskinen din er klar. Jeg har lagt inn verktøyene prosjektet trenger, i din egen
> brukermappe — ingen administratorrettigheter, ingenting som rører resten av maskinen. Vil du bli
> kvitt dem senere, er det bare å slette én mappe, så sier jeg fra hvilken.

Then get back to what the participant came for. The logins happen when they are needed, via
`skadefryd-login`. The setup is not the point of the day.
