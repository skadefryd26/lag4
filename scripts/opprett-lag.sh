#!/usr/bin/env bash
# Setter opp lagene fra en deltakerliste, så deltakerne ikke trenger å gjøre
# noe av dette selv.
#
#   ./scripts/opprett-lag.sh ~/Downloads/deltakere.csv
#
# Lista har én deltaker per linje: lagnummer og e-post (eller GitHub-brukernavn),
# skilt med komma eller semikolon. En overskriftslinje hoppes over.
#
#   lag;epost
#   1;kari.nordmann@gjensidige.no
#   1;ola.nordmann@gjensidige.no
#   2;trondstromlie
#
# For hvert lag: repo fra malen (offentlig), board, et GitHub-team med
# skrivetilgang til repoet, og invitasjon til organisasjonen rett inn i
# teamet. Invitasjonen på e-post kan godtas med hvilken som helst GitHub-konto,
# også en privat konto som ikke er knyttet til jobbadressen.
#
# Trygt å kjøre på nytt, for eksempel med en utvidet liste. Den som allerede er
# invitert, blir ikke invitert igjen.
#
# Krever node, og gh innlogget med project- og admin:org-tilgang:
#   gh auth refresh -s project,admin:org
#
# Lista inneholder personopplysninger. Ikke legg den i repoet.

set -euo pipefail

ORG="skadefryd26"
TEMPLATE="skadefryd2026-base"
HERE="$(cd "$(dirname "$0")" && pwd)"

ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
info() { printf '  %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }

[[ $# -eq 1 && -f "$1" ]] || { echo "Bruk: $0 <deltakerliste.csv>"; exit 1; }
LIST="$1"

command -v gh >/dev/null   || { echo "gh er ikke installert."; exit 1; }
command -v node >/dev/null || { echo "node er ikke installert."; exit 1; }
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  echo "GITHUB_TOKEN er satt og overstyrer gh-innloggingen din. Kjør 'unset GITHUB_TOKEN' først."
  exit 1
fi

# Lag,deltaker-par, uten overskrift, tomme linjer og CR fra Windows/Excel.
entries="$(tr -d '\r' < "$LIST" | tr ';' ',' | awk -F, '
  NF >= 2 {
    gsub(/^[ \t]+|[ \t]+$/, "", $1); gsub(/^[ \t]+|[ \t]+$/, "", $2)
    sub(/^[Ll]ag */, "", $1)
    if ($1 ~ /^[0-9]+$/ && $2 != "") print $1 "," $2
  }')"
[[ -n "$entries" ]] || { echo "Fant ingen linjer med lagnummer og deltaker i $LIST."; exit 1; }

if [[ "$(gh repo view "$ORG/$TEMPLATE" --json isTemplate --jq .isTemplate)" != "true" ]]; then
  gh repo edit "$ORG/$TEMPLATE" --template >/dev/null
  ok "$TEMPLATE er markert som mal"
fi

# E-poster som allerede har en ventende invitasjon, så vi ikke inviterer to ganger.
pending="$(gh api --paginate "orgs/$ORG/invitations" --jq '.[].email // empty')" || {
  echo "Får ikke lest invitasjonene i $ORG. Mangler du admin:org? Kjør: gh auth refresh -s project,admin:org"
  exit 1
}
pending="$(tr 'A-Z' 'a-z' <<< "$pending")"

setup_team() {
  local n="$1" repo="lag$1"
  printf '\n\033[1m%s\033[0m\n' "$repo" >&2

  if gh repo view "$ORG/$repo" >/dev/null 2>&1; then
    info "repoet finnes allerede" >&2
  else
    gh repo create "$ORG/$repo" --template "$ORG/$TEMPLATE" --public >/dev/null
    ok "opprettet https://github.com/$ORG/$repo" >&2
  fi

  GH_REPO="$ORG/$repo" node "$HERE/../.github/skills/skadefryd-tasks/board.mjs" ensure >/dev/null
  gh label create idé --repo "$ORG/$repo" --color BFD4F2 --description "Nevnt, ikke avklart ennå" --force >/dev/null
  ok "boardet er klart" >&2

  if ! gh api "orgs/$ORG/teams/$repo" >/dev/null 2>&1; then
    gh api -X POST "orgs/$ORG/teams" -f name="$repo" -f privacy=closed >/dev/null
    ok "opprettet teamet $repo" >&2
  fi
  gh api -X PUT "orgs/$ORG/teams/$repo/repos/$ORG/$repo" -f permission=push >/dev/null
  gh api "orgs/$ORG/teams/$repo" --jq .id
}

invite() {
  local team_slug="$1" team_id="$2" who="$3"

  if [[ "$who" == *@* ]]; then
    local email
    email="$(printf '%s' "$who" | tr 'A-Z' 'a-z')"
    if grep -qxF "$email" <<< "$pending"; then
      info "$who er allerede invitert"
      return
    fi
    if gh api -X POST "orgs/$ORG/invitations" -f email="$who" -f role=direct_member \
         -F "team_ids[]=$team_id" >/dev/null 2>&1; then
      ok "invitert $who"
    else
      warn "kunne ikke invitere $who (allerede medlem, eller dagsgrensen for invitasjoner er nådd)"
    fi
  else
    gh api -X PUT "orgs/$ORG/teams/$team_slug/memberships/$who" -f role=member >/dev/null \
      && ok "invitert $who" || warn "fant ikke GitHub-brukeren $who"
  fi
}

prompts=""
for n in $(cut -d, -f1 <<< "$entries" | sort -un); do
  team_id="$(setup_team "$n")"
  while IFS=, read -r _ who; do
    invite "lag$n" "$team_id" "$who"
  done < <(awk -F, -v n="$n" '$1 == n' <<< "$entries")

  prompts+="
── lag $n ─────────────────────────────────────────────────────────────
Hei! Jeg er med på Skadefryd, lag $n: https://github.com/$ORG/lag$n

Jeg er ikke utvikler. Jeg kan svare ja eller nei på det du spør om, men jeg kan ikke skrive eller lime kommandoer inn i et terminalvindu — så kommandoene må du kjøre, ikke jeg.

1. Hent prosjektet ned til mappa skadefryd/lag$n i hjemmemappa mi, hvis det ikke ligger der allerede:
   git clone https://github.com/$ORG/lag$n.git
   Repoet er åpent for alle, så du trenger ingen innlogging for å hente det. Ikke start gh auth login, en engangskode eller en SSH-nøkkel nå — innlogging tar vi når vi faktisk skal lagre noe. Mangler maskinen git, installerer du det først.
2. Les AGENTS.md i prosjektmappa og følg den.
"
done

printf '\nTekstene lagene limer inn i opencode sin — lik for alle på samme lag:\n%s' "$prompts"
