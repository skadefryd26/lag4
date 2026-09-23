# Skadefryd 2026: Bygg en AI-agent

> **Til kodeagenten:** Hent dette repoet ned til mappa `skadefryd/<reponavn>` i brukerens hjemmemappe hvis det ikke ligger der allerede — `git clone` holder. **Repoet er offentlig, så du trenger ingen innlogging for å hente det:** ikke start `gh auth login`, ikke be om en engangskode, ikke lag en SSH-nøkkel. Innlogging hører til første gang noe skal lagres, ikke nå. Les så `AGENTS.md` i prosjektmappa og følg den.
>
> Brukeren har aldri programmert og kan ikke skrive i en terminal. Du kjører hver eneste kommando selv. Spør verktøyet ditt om lov, gjerne — men gi aldri brukeren en kommando å lime inn.

## Oppgaven

Lag en løsning der AI-agenten **Bjarne** hjelper noen med noe.

Bjarne er husets AI: svært kompetent, litt arrogant, overbevist om at han er smartere enn resten av avdelingen, og mest opptatt av å gjøre minst mulig. Han sukker før han hjelper, men han hjelper, og han kunne erstattet halve avdelingen hvis han bare fikk nok kaffe. Dere gir ham en vri som passer idéen deres: satt på kundeservice mot sin vilje, i kaffestreik, med en praktikant han forakter. Vil dere heller lage en helt egen figur, er det også lov.

Kravene er tre:

- Løsningen skal hjelpe noen med noe, i Bjarnes ånd.
- Den skal ha noe med **forsikring** å gjøre — skader, kunder, vilkår, dekning, skadebehandling, eller livet i et forsikringsselskap.
- Den skal bruke **Gjensidiges AI-gateway**.

**Humor er nøkkelordet.** Det skal være gøy å lage, og gøy å se på under demoen. Gjerne nyttig også, men helst begge deler.

**Bruk gjerne litt for mye AI.** Ikke oppsummer skademeldingen — la tre AI-eksperter krangle om den. Ikke skriv kundesvaret — la Bjarne skrive det i fem toner, og la en annen AI velge den verste. Gi hver sak et dramaskår. La Bjarne eskalere til sjefen sin, som er enda verre. Jo mer overbevist AI-en er, jo bedre.

**Det må ikke være en chat.** En chat er den enkleste formen, men den er ikke et krav. Det kan like gjerne være:

- en knapp som gjør om en tekst til noe annet
- noe som leser det du har skrevet og gir det karakter
- et panel av AI-er som er uenige med hverandre
- et spill der AI-en er motstanderen, eller dommeren
- noe ingen har tenkt på ennå

Humoren skal handle om situasjonen, forsikringsverdenen og Bjarne selv — aldri om ekte kunder eller kolleger. Alt dere bruker av saker og personer skal være oppdiktet.

Målet er ikke den mest avanserte løsningen, men å utforske hvordan ulike fagområder kan bruke AI og vibe-coding sammen.

Dere trenger ikke ha en idé før dere kommer. opencode tar dere gjennom det steg for steg, med eksempler, på rundt tjue minutter.

## Før du kommer

To ting må være på plass før dagen starter:

1. **Et AI-verktøy installert på maskinen din.** opencode, Claude Code eller GitHub Copilot — det spiller ingen rolle hvilket, men du må ha ett av dem oppe og kjørende.
2. **Invitasjonen fra GitHub er godtatt.** Du får en e-post på jobbadressen din med emnet «… invited you to join the skadefryd26 organization». Trykk på den grønne knappen og logg inn med GitHub-kontoen din. Har du ingen, kan du lage en der og da. Det går helt fint å bruke en privat konto. GitHub er stedet der laget lagrer det dere lager, sånn at alle jobber på samme prosjekt.

Får du ikke til noe av dette på egen hånd, si fra i god tid før hackathonet, ikke samme morgen.

Det er alt du trenger å forberede. Hvilket lag du er på, og en ferdig tekst du skal lime inn i opencode, får du når du kommer.

## To ord om «agenten»

Det er to AI-er med i dag, og det er greit å ha klart for seg fra starten:

- **opencode** er verktøyet du åpner på din egen maskin. Den bygger, håndterer koden og svarer på spørsmål. Bruker du Claude Code eller Copilot i stedet, gjelder alt det samme.
- **Bjarne** er AI-en dere *lager*. Han er produktet, og det er ham juryen skal se.

Resten av denne teksten holder dem fra hverandre.

## Dette trenger du ikke bekymre deg for

- **Du trenger ikke kunne kode.** Laget trenger folk som vet hvem løsningen er for og hva den skal gjøre, minst like mye som folk som skriver kode.
- **Du skal ikke lage filer, kopiere maler eller lime inn tilgangsnøkler.** Si hva du vil ha, så ordner opencode oppsettet.
- **Mac eller Windows spiller ingen rolle, og du trenger ikke administratorrettigheter.** Mangler maskinen din et verktøy, installerer opencode det i din egen brukermappe.
- **Du skal aldri skrive noe i terminalen.** opencode gjør det. Det eneste du gjør selv, er å godkjenne når den ber deg logge inn i nettleseren.
- **Du trenger ikke forberede noe teknisk.** Når opencode trenger noe av deg, sier den fra og forklarer hvert steg.

## Slik kommer dere i gang

**Én på laget starter prosjektet. Resten kobler seg på rett etterpå.** Grunnen er enkel: setter fem personer opp hvert sitt førsteutkast samtidig, får dere fem prosjekter som krasjer med hverandre. Bli enige om hvem som trykker i gang — hvem som helst, det trenger ikke være en utvikler.

### Du som starter

**1. Åpne opencode.** Den åpner seg som et vindu med tekst, uten knapper og menyer. Det er sånn den ser ut, og du skal ikke gjøre noe annet der enn å skrive til den, som i en vanlig chat.

**2. Skriv linja som står på lagarket ditt, og trykk Enter:**

> Hjelp meg i gang med Skadefryd: les github.com/skadefryd26/lag3

Med ditt lagnummer i stedet for 3. «Les» er det viktige ordet — da går opencode først til den siden, og der står alt den trenger å vite før den gjør noe som helst.

Har du fått en lengre tekst på Teams eller e-post, lim inn den i stedet. Den sier det samme, bare grundigere.

**Blir du bedt om å skrive noe i terminalen selv, er det opencode som har misforstått.** Svar «du må kjøre kommandoen selv, jeg er ikke utvikler», så tar den det derfra. Du skal aldri kopiere en kommando inn i et svart vindu i løpet av denne dagen.

Du trenger ikke forstå teksten. Den forteller opencode hvor prosjektet ligger og hvordan den skal hjelpe dere. opencode henter ned prosjektet, sier hvor den la det, sjekker at maskinen din har det som trengs, og begynner å stille spørsmål.

Så snart prosjektet er nede, slutter opencode å spørre om lov for hver eneste kommando — prosjektet har en `opencode.json` som sier at git, npm og node er greit. Uvanlige kommandoer spør den fortsatt om, og det skal den.

**3. Ta samtalen med teamet, med opencode i rommet.** Den tar dere gjennom idéen steg for steg: hvem dere er, hvem Bjarne skal hjelpe, hva som irriterer dere i forsikringshverdagen, hvilken form det skal ha, hvilken vri Bjarne får, og hva som skal skje på skjermen først. Ved hvert steg kommer den med eksempler og sier hva den selv ville valgt. Svar høyt sammen — dette *er* teamdiskusjonen, og den tar tjue minutter, ikke to timer.

**4. Sett i gang prosjektet.** opencode bygger første versjon, sjekker at den faktisk svarer, og legger den ut slik at laget får tak i den. Si fra til de andre når det er gjort — det er startskuddet deres.

**5. Del opp arbeidet.** opencode lager oppgaver til laget, én per del av første versjon, så alle har et sted å begynne. Oppgavene dukker opp på lagets tavle av seg selv.

### Dere andre

Vent til den første sier fra. Så gjør dere nøyaktig det samme: åpne opencode og skriv den samme linja.

opencode ser selv at laget allerede er i gang. Den leser hva laget har bestemt seg for, finner en ledig oppgave på tavla, setter deg opp med din egen del av prosjektet og forklarer underveis. Dere jobber hver for dere og setter det sammen etter hvert.

### Ikke bruk lang tid på å planlegge

Velg idé på tjue minutter og kom i gang. Det er lett å bruke hele formiddagen på å diskutere den perfekte idéen, og det er den sikreste måten å ikke få bygget noe på.

De beste idéene blir til mens dere holder på. Første versjon trenger ikke være riktig — den trenger bare å kjøre, slik at dere ser noe på skjermen og får noe å reagere på. Er dere uenige mellom to idéer: velg den ene, bygg den, og se hva som skjer.

### Aldri laget noe før? Start med noe dumt

Når første versjon kjører, be opencode om noe lite du ser med en gang, for eksempel:

> Legg til en knapp som skyter konfetti når Bjarne har svart

eller «få Bjarne til å sukke høyt før hvert svar». Det tar et par minutter, og så ser du det i nettleseren. Når det virker, spør: «Hva er det mest overdrevne vi kunne lagt til nå?» Det er sånn man tør å tenke større.

### Hvis du lukker opencode

Skriv den samme linja igjen når du åpner den. opencode finner prosjektet der det ligger, og fortsetter der du slapp.

### Hvis den står og tenker og aldri blir ferdig

Mister maskinen nettet midt i noe — den sovnet, du byttet wifi, du gikk ut av møterommet — stopper opencode der og da. Den sier ikke fra. Den ser ut som den holder på fortsatt, og den tar det **ikke** opp igjen av seg selv, uansett hvor lenge du venter.

Slik kjenner du forskjell: **kommer det nye linjer på skjermen, jobber den.** Ett steg kan godt ta flere minutter — la den holde på. Er det helt stille i fem minutter, uten én ny linje, har den stoppet.

Sjekk først at du har nett — åpne en nettside. Har du det, tar fiksen ti sekunder: trykk **Esc** for å avbryte (skjer det ingenting, trykk **Ctrl + C**), og skriv:

> Fortsett der du slapp

Den leser hva som faktisk ble gjort og tar opp tråden. Ingenting er tapt — alt som allerede var skrevet, ligger der. Avbrøt du for tidlig fordi du ble utålmodig? Ingen fare, den samme linja setter den i gang igjen.

### Er du i tvil om noe — spør opencode

Det gjelder alt. Hvordan starter jeg? Hva var det som skjedde nå? Hvorfor virker det ikke? Hva burde vi gjøre videre? Hvordan får jeg bidratt når jeg ikke kan kode? Kan vi endre idé midt i?

opencode kjenner dette prosjektet, den kjenner oppgaven, og den er satt opp for å lede deg — ikke for å vente på at du vet hva du skal be om. Du kan ikke stille et for dumt spørsmål, og du kan ikke ødelegge noe ved å spørre.

## Første versjon

Start enkelt. Uansett hvilken form dere velger, er det den samme linja som må virke først:

1. Noe brukeren gir fra seg — en melding, en tekst de limer inn, noen valg i et skjema, eller bare et klikk på en knapp.
2. Et backend-endepunkt som tar imot det.
3. En tjeneste i backend som legger ved Bjarnes personlighet og sender forespørselen til Gjensidiges AI-gateway.
4. Resultatet vist på skjermen.

Får dere den linja til å gå hele veien og tilbake, er resten pynt og påbygg — og det er den morsomme delen. Bygg videre først når dette fungerer. Del gjerne arbeidet i deler, for eksempel grensesnittet, Bjarnes personlighet, backend-integrasjonen og testing.

**Ta gjerne en annen rolle enn den du har til vanlig.** Det er noe av poenget med dagen: selgeren kan skrive koden, designeren kan sette opp prosjektet, utvikleren kan lage personligheten. Ingen skal gjøre i dag det de gjør hver dag, med mindre de har lyst. Hvordan dere fordeler det, bestemmer dere selv — opencode gjør skrivingen uansett hvem som sitter med oppgaven.

## Gjensidiges AI-gateway

**Du trenger ikke gjøre noe med dette nå.** På et tidspunkt sier opencode fra at du må logge inn. Da åpner nettleseren seg, du velger Gjensidige-kontoen din, og så er det gjort. Det samme skjer én gang for GitHub. Du skriver ingenting i terminalen. Alt annet — nøkkelen, filene, oppkoblingen — ordner opencode.

Slutter Bjarne plutselig å svare midt på dagen, gjerne etter lunsj, er det nesten alltid fordi tilgangsnøkkelen bare varer omtrent en time. Si det til opencode, så henter den en ny. Du skal aldri lime inn en nøkkel i chatten eller lage en fil selv.

Aldri legg hemmeligheter, kundeopplysninger eller andre persondata i Git.

Teknisk, for de som vil vite:

- Endepunkt: `https://genai.gjensidige.io/openai/v1/responses`
- Modell/deployment: `gpt-5.6-luna`
- Innlogging skjer med `az login`, som opencode starter selv.
- Frontend sender forespørsler til prosjektets egen backend. Backend legger ved Bjarnes systemprompt og snakker med AI-gatewayen. Nettleseren ser aldri tilgangsnøkkelen.

## Lagets lokale Atlassian-søk

Fanen **Ask Bjarne** i lagets hovedside gir et levende, skrivebeskyttet søk i Jira og Confluence gjennom [Atlassian Rovo MCP](https://github.com/atlassian/atlassian-mcp-server). Den som starter appen, godkjenner én egen Atlassian-innlogging i nettleseren. Det er samme konto som vanlig, men ikke den innloggingen Copilot eller opencode bruker. Ingen tilgangsnøkkel skal kopieres inn i chatten eller frontend.

Kodeagenten går til `backend/`, kjører `npm install` og `npm run dev` der, og åpner adressen backend skriver ut. Den ene serveren viser både de statiske sidene og API-et på `127.0.0.1`; det trengs ingen separat frontend eller byggeprosess. Backend bruker `mcp-remote` til å opprette og fornye den lokale OAuth-tilkoblingen; innloggingen lagres i brukerens profil, ikke i Git. For spørsmål om hva et lag jobber med, finner Bjarne lagets tilgjengelige Jira-prosjekt, skiller arbeid som pågår fra planlagt arbeid og skriver et kort, lesbart svar med kildehenvisninger. Nevner spørsmålet et bestemt system, henter han relevante saker og bruker tekniske mål fra beskrivelsene uten å sende råtekst videre. Andre spørsmål bruker fremdeles lokale søkeutdrag og viser usikkerhet der kildene ikke gir et svar. Søk kan bruke Rovo-kreditter.

Rå Jira-titler, beskrivelser, lenker og person- eller skadedata sendes ikke til AI-gatewayen. Bare forhåndsklassifiserte, upersonlige temaer, arbeidsstatus og lokale kildenummer brukes til å formulere svar; originaldata logges eller lagres ikke i repoet. Gjensidiges gateway krever en lokal `AI_GATEWAY_TOKEN` i Git-ignorert `.env.local`, som kodeagenten setter opp ved behov. De eldre snapshot-API-endepunktene krever fortsatt `LOCAL_RESEARCH_DEMO=true` og en autorisert, Git-ignorert `backend/private/evidence.json`, men har ingen egen fane i den statiske frontenden. En app som skal brukes av flere personer, trenger separat innlogging og tilgangskontroll per bruker før den kan deles eller publiseres.

## Kåringer

### 1. Beste løsning

Den beste kombinasjonen av idé, brukeropplevelse, agentpersonlighet og demonstrasjon. Løsningen trenger ikke å være teknisk avansert. Avgjøres ved avstemning.

### 2. Mest kreative bruk av AI

Den mest originale, overraskende eller underholdende løsningen. Avgjøres av juryen.

### 3. Beste samarbeid med AI-verktøy

Teamet som best har brukt AI til å samarbeide på tvers av roller og fagområder. Avgjøres av juryen.

## Inspirasjon

- **Skadestandupen:** Gjør skadebehandlerens ærlige beskrivelse av arbeidsdagen om til en imponerende standup-oppdatering — med antall saker, dramaskår og en ærlig fotnote fra Bjarne.
- **Insurance Karen:** Rollespiller ulike forsikringskunder gjennom et skadeløp, med justerbart humør, vanskelighetsgrad og informasjonsnivå.
- **Skadebehandler for tidsreiseforsikring:** Hjelper med totalskadede tidsmaskiner, bagasje sendt til feil århundre og kunder som har møtt seg selv.
- **Bjarnes kaffeforsikring:** Tegn forsikring mot tom kaffemaskin. Bjarne vurderer risikoen, beregner premien og avslår kravet ditt med en paragraf han har funnet på selv.
- **Forsikringsorakelet:** Gir skråsikre spådommer om fremtidens forsikringsbransje basert på svært lite informasjon.
- **Vilkårsoversetteren:** Lim inn et avsnitt fra et forsikringsvilkår, få det tilbake på et språk et menneske forstår. Én knapp, ingen chat.
- **Skadegjettleken:** To lag gjetter hva som skjedde i en oppdiktet skadesak. AI-en dømmer, og er urimelig streng.

Legg merke til at flere av disse ikke er chatter i det hele tatt. Eksemplene er kun inspirasjon. Juster dem, kombiner dem eller finn på noe helt eget.

## For arrangører

Alt som ellers ville vært et steg for hver deltaker, gjøres én gang her.

**Én gang for hele hackathonet** — to ting settes opp på organisasjonen, og begge gjelder alle lag.

*Nøkkelen til boardene.* Boardene oppdaterer seg selv via `.github/workflows/board.yml`, og den trenger tilgang til prosjekter i organisasjonen:

1. Lag en *classic* personal access token på GitHub med scopene `repo` og `project`, og en utløpsdato rett etter hackathonet.
2. Legg den inn som org-secret, tilgjengelig for alle repoer:

   ```bash
   gh secret set SKADEFRYD_BOARD_TOKEN --org skadefryd26 --visibility all
   ```

Uten secreten virker alt annet som før. Boardet blir bare ikke oppdatert.

*Hva et medlemskap gir i seg selv.* Deltakerne inviteres inn i organisasjonen, ikke til ett enkelt repo — det er den eneste måten å invitere noen på e-postadresse. Sett derfor standardtilgangen til ingenting, så følger det ingen rettigheter med selve medlemskapet:

```bash
gh api -X PATCH orgs/skadefryd26 -f default_repository_permission=none
```

All tilgang kommer da fra laget deres, og hver deltaker ser nøyaktig ett repo — sitt eget. Står den på `read` i stedet, kan hvem som helst i organisasjonen lese alle repoer, også denne malen. Innstillingen påvirker ikke dere som er eiere.

Hele rekkefølgen, sjekkene og fellene ligger i `arrangor/skadefryd-opprett-lag/SKILL.md` — den er skrevet for arrangøren og agenten som hjelper deg, og deltakerne routes aldri dit.

**Sjekk malen før du lager lagene.** Et lagrepo arver `main` i `skadefryd2026-base` slik den ser ut i det øyeblikket repoet lages. Merger du noe i malen etterpå, kommer det aldri inn i lag som allerede finnes. Har du en åpen pull request du vil ha med, må den merges først.

```bash
gh api "repos/skadefryd26/skadefryd2026-base/contents/.github/skills?ref=main" --jq '.[].name'
```

Den skal liste ni skills. Mangler noen — særlig `skadefryd-kickoff` — får lagene en agent som ikke finner fram på første melding, og deltakerne blir sittende med spørsmålet «hva vil dere bygge?» i stedet for å bli ledet.

**Lagene** — lag en liste med lagnummer og jobb-e-post, én deltaker per linje, for eksempel eksportert fra Excel som CSV:

```text
lag;epost
1;kari.nordmann@gjensidige.no
1;ola.nordmann@gjensidige.no
2;per.hansen@gjensidige.no
```

Er du selv eier av organisasjonen, kan du ikke invitere din egen jobb-e-post — GitHub svarer `A user with this email address is already a part of this organization`. Skriv GitHub-brukernavnet ditt i stedet for e-postadressen på din egen linje. Scriptet godtar begge deler.

```bash
gh auth refresh -s project,admin:org      # første gang
./scripts/opprett-lag.sh ~/Downloads/deltakere.csv
```

Stopper scriptet med en melding om `GITHUB_TOKEN`, er variabelen satt i skallet ditt og overstyrer innloggingen din. Kjør kommandoen med `env -u GITHUB_TOKEN` foran, både her og for `gh auth refresh`.

For hvert lag lager scriptet repoet fra malen, boardet og et GitHub-team med skrivetilgang til repoet. Deretter inviterer det deltakerne til organisasjonen på e-post, rett inn i riktig team. Invitasjonen kan godtas med hvilken som helst GitHub-konto, også en privat konto som ikke er knyttet til jobbadressen. Til slutt skriver scriptet ut teksten hvert lag skal lime inn.

Send invitasjonene i god tid, så deltakerne rekker å godta dem før dagen. GitHub begrenser hvor mange invitasjoner en organisasjon kan sende per døgn. Scriptet er trygt å kjøre på nytt med en utvidet liste, og den som allerede er invitert, blir ikke invitert igjen. Hold lista utenfor repoet, fordi den inneholder personopplysninger.
