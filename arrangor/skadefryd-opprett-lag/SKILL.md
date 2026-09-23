---
name: skadefryd-opprett-lag
description: 'For arrangører av Skadefryd 2026, ikke for deltakere. Les denne før du oppretter lagrepoer, inviterer deltakere, kjører scripts/opprett-lag.sh, eller skal få en oppdatering av malen inn i et lag som allerede finnes. Dekker rekkefølgen, hva som må sjekkes før og etter, og feilene som faktisk ble gjort.'
---

# Opprett lag — for arrangører

**Er du agenten til en deltaker, skal du ikke bruke denne.** Den oppretter repoer, team og
invitasjoner i organisasjonen `skadefryd26`, og ingenting her er en oppgave for et lag. Deltakerne
routes fra `AGENTS.md` til `.github/skills/`. Hele `arrangor/` er utenfor det.

## Den ene regelen som styrer rekkefølgen

**Et lagrepo arver `main` i malen slik den så ut i sekundet repoet ble laget.** Merger du noe i
malen etterpå, kommer det aldri inn i lag som allerede finnes. Det finnes ingen synk.

Derfor: **malen er ferdig først, laget lages etterpå.** Ikke omvendt, og ikke «jeg fikser det
etterpå» — etterpå er en pull request per lagrepo, for hånd.

Dette ble brutt 22. september. `lag1` ble opprettet mens tre pull requests lå åpne i malen, fordi
mergen var sperret der og da. Resultatet var to runder med etterarbeid: én fiks limt rett inn i
lagrepoet, og en PR til da de to neste landet. Ingen av delene hadde vært nødvendig hvis
rekkefølgen holdt. Er mergen sperret for deg — **vent, eller få den merget.** Ikke opprett laget.

## Før du kjører scriptet

```bash
# 1. Ingenting åpent i malen
gh pr list --repo skadefryd26/skadefryd2026-base --state open

# 2. Malen har alt. Skal gi 9 navn.
gh api "repos/skadefryd26/skadefryd2026-base/contents/.github/skills?ref=main" --jq '.[].name'

# 3. Rota skal ha CLAUDE.md, AGENTS.md, scripts, .gitattributes
gh api "repos/skadefryd26/skadefryd2026-base/contents?ref=main" --jq '.[].name'
```

Mangler `skadefryd-kickoff`, får laget en agent som ikke finner fram på første melding, og
deltakeren sitter igjen med «hva vil dere bygge?». Det er hele dagen deres.

**Alt mot GitHub kjøres med `env -u GITHUB_TOKEN` foran.** Variabelen er satt på arrangørmaskinen
og overstyrer gh-innloggingen. Scriptet nekter å starte uten, men `gh auth refresh` og `gh api`
gjør ikke det — de bruker bare feil identitet, stille.

## Lista

Én deltaker per linje, lagnummer og jobb-e-post, komma eller semikolon:

```text
lag;epost
1;kari.nordmann@gjensidige.no
1;ola.nordmann@gjensidige.no
```

**Arrangører står med GitHub-brukernavn, ikke e-post.** Er du eier av organisasjonen, er jobb-
e-posten din allerede verifisert på en konto som er medlem, og invitasjonen feiler med `422 A user
with this email address is already a part of this organization`. Scriptet godtar begge former.

Lista inneholder personopplysninger. Den skal ikke i repoet — `.gitignore` dekker `*.csv`.

## Kjøringen

```bash
env -u GITHUB_TOKEN gh auth refresh -s project,admin:org      # første gang
env -u GITHUB_TOKEN ./scripts/opprett-lag.sh ~/Downloads/deltakere.csv
```

Per lag lager den repoet fra malen, boardet, et team med push-tilgang, og inviterer deltakerne
inn i organisasjonen rett i teamet. Til slutt skriver den ut teksten hvert lag limer inn.

Trygt å kjøre på nytt med en utvidet liste. Den som allerede er invitert, hoppes over. Send
invitasjonene i god tid — GitHub har en døgngrense per organisasjon.

## Etterpå — sjekk, ikke anta

Scriptet skriver grønne haker uansett. Verifiser det som faktisk betyr noe:

```bash
gh api "repos/skadefryd26/lag1/contents/.github/skills?ref=main" --jq '.[].name' | wc -l
gh api -H "Accept: application/vnd.github.v3.repository+json" \
  "orgs/skadefryd26/teams/lag1/repos/skadefryd26/lag1" --jq '{role: .role_name, push: .permissions.push}'
gh api orgs/skadefryd26/invitations --jq '.[] | "\(.email // .login)  team:\(.team_count)"'
```

Teamet skal ha `push`/`write`, og hver invitasjon skal ha `team:1`. En invitasjon uten team gir et
medlemskap uten tilgang til noe som helst, fordi `default_repository_permission` er `none`.

## Når laget allerede finnes og malen har gått videre

Da er det en pull request i lagrepoet. Ikke overskriv filer, og ikke opprett laget på nytt —
deltakerne har egne commits der fra første minutt.

```bash
git clone git@github.com:skadefryd26/lagN.git /tmp/lagN     # ssh, se under
cd /tmp/lagN && git checkout -b oppdatering-fra-malen
# kopier filene inn fra malens main
git --git-dir=<mal>/.git --work-tree=<mal> archive main <sti> ... | tar -x
git add -A && git commit -m "..." && git push -u origin oppdatering-fra-malen
gh pr create --repo skadefryd26/lagN --base main --head oppdatering-fra-malen --title "..." --body "..."
```

Si i PR-en hvorfor den kommer: laget ble opprettet før endringen landet i malen.

## Fire feller, alle sammen gått i

- **`gh repo clone` over https har ingen innlogging her.** `gh auth status` sier
  `Git operations protocol: ssh`, så en https-klone feiler på push med
  `could not read Username for 'https://github.com'`. Klon med `git@github.com:`-adressen,
  eller sett `git remote set-url origin` etterpå.
- **En nektet kommando avbryter hele linja.** Blir pushet sperret i
  `git add … && git commit … && git push …`, ble committen heller aldri kjørt. Sjekk
  `git log --oneline -2` før du konkluderer med at det bare var pushet som manglet.
- **Skriv aldri en fil via contents-API-et uten å ha innholdet klart.** En README ble erstattet
  med 19 tegn plassholdertekst og måtte skrives på nytt i commiten etter. Les filen tilbake og
  diff den mot kilden når du er ferdig.
- **Branch fra `origin/main`, ikke fra der du tilfeldigvis står.** Arbeid havnet på en åpen
  PR-branch og måtte stashes over. `git checkout -b <navn> origin/main`.

## To ting som ikke kan testes med en arrangørkonto

- **Invitasjons-e-posten og den grønne Join-knappen.** Krever en adresse som ikke er verifisert på
  en konto som allerede er i organisasjonen. En Gmail-alias (`navn+lag3@gmail.com`) er nok til å
  *se* e-posten.
- **At push via team faktisk virker for en ikke-eier.** Krever en fersk konto som godtar
  invitasjonen. Dette er den eneste feilen som ville rammet et helt lag samtidig.
