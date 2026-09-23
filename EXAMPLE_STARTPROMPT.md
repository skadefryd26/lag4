## Eksempel startprompt: Bjarne og tidsreiseforsikring

Vi skal lage en prototype på en webapplikasjon for tidsreiseforsikring.

Brukeren møter AI-agenten Bjarne, som hjelper kundebehandlere med skadesaker knyttet til tids-reiser.

## Slik lager kodeagenten lagets egen startprompt

Denne fila er et eksempel. Lagets egen startprompt skrives til `.ai/startprompt.md` av kodeagenten, etter samtalen i `skadefryd-kickoff`.

Ikke still laget flere spørsmål for å skrive den. Spørsmålene er allerede stilt i kickoff-samtalen, og idéen, navnet, personligheten og arbeidsdelingen er bestemt. Resten er tekniske valg, og dem tar kodeagenten selv ut fra standardene i `AGENTS.md`.

Startprompten skal være komplett nok til at en annen kodeagent kan bygge første versjon uten å gjette på produktkrav eller tekniske kontrakter. Den skal inneholde:

* Produktmål og hvem løsningen er for
* Avgrenset første versjon med akseptansekriterier: hva brukeren ser og gjør
* Agentens navn og systemprompt
* Tekniske rammer og kjente integrasjoner
* Sikkerhet og håndtering av hemmeligheter
* Foreslått filstruktur og ansvarsdeling, koblet til oppgavene (issues) i repoet
* API-kontrakter, inkludert request-, response- og feiltyper når de er kjent
* Plan for lokal oppstart og smal validering
* Mulige senere utvidelser, tydelig merket som utenfor første versjon
* `Åpne spørsmål`, hvis det finnes noen

Laget skal ikke lese eller godkjenne startprompten linje for linje. Vis dem et kort sammendrag på vanlig norsk — hva brukeren gjør, hvordan agenten er, hva første versjon viser på skjermen, og hvem som bygger hva — og få et ja før implementasjonen starter.

---

## Referansebrief: Bjarne og tidsreiseforsikring

Dette er ett eksempel, og det er tilfeldigvis en chat. Teamets egen løsning trenger ikke være det — en knapp, et skjema, en generator eller et spill teller like mye. Behold strukturen under, bytt ut formen.

### Første versjon

Lag en enkel løsning der:

1. Brukeren kan skrive til Bjarne i en chat.
2. Frontend sender meldingen til et backend-endepunkt.
3. Backend sender forespørselen til Gjensidiges AI-gateway.
4. Svaret vises i chatten.

Start med denne minimumsløsningen før du bygger mer funksjonalitet.

### Avklarte tekniske beslutninger

* Frontend: React, TypeScript, Vite, TanStack Router, TanStack Query og Mantine.
* Backend: Node.js, TypeScript og Express.
* Frontend: Et webgrensesnitt med chat.
* Backend: Et API-lag som legger ved Bjarnes systemprompt, kommuniserer med AI-tjenesten og returnerer svaret til frontend.
* Frontend skal ikke kommunisere direkte med AI-gatewayen.
* Legg én konkret plassering for tokenet i en ignorert `.env.local`-fil, og opprett en tilsvarende `.env.example` uten token.
* Legg til én kommando for lokal utvikling og én kommando for smal validering.

### Filstruktur og samarbeid

Organiser koden etter feature og ansvar, slik at flere teammedlemmer kan jobbe parallelt med minst mulig konflikt.

* Én feature skal normalt eie sine egne UI-komponenter, API-klient, backend-rute, tjenestelogikk, typer og tester.
* Hold oppstartsfiler små. `server.ts` skal bare konfigurere server, middleware og ruter. Frontendens entrypoint skal bare konfigurere applikasjonens providers og ruter.
* Skill presentasjonskomponenter fra API-kall og servertilstand.
* Legg eksterne integrasjoner, som AI-gatewayen, bak en egen klient eller tjeneste.
* Samle kontrakter som brukes på tvers av frontend og backend i en tydelig, stabil plassering.
* Unngå at features importerer interne implementasjonsdetaljer fra hverandre. Del kun bevisste, stabile grensesnitt.
* Endre delte filer som ruter, provider-oppsett eller globale temaer bare når integrasjon krever det.
* Opprett ikke generiske `utils`- eller `shared`-mapper uten et konkret, delt behov.
* Dokumenter hver feature kort med ansvar, API-kontrakt og lokal testkommando dersom dette ikke er åpenbart fra koden.

Bruk denne strukturen som utgangspunkt når en feature trenger både frontend og backend:

```text
frontend/src/features/<feature>/
  components/
  api/
  hooks/
  routes/
  types/
  tests/

backend/src/features/<feature>/
  routes/
  services/
  clients/
  types/
  tests/
```

AI-tilkobling:

* Endepunkt: https://genai.gjensidige.io
* kodeagenten starter innloggingen med `az login` selv, og deltakeren godkjenner i nettleseren. Se `.github/skills/skadefryd-login/SKILL.md`.
* kodeagenten henter tilgangstokenet med `az account get-access-token --resource https://cognitiveservices.azure.com` og skriver det selv til en `.env.local`-fil som ikke committes. Se `.github/skills/skadefryd-ai-gateway/SKILL.md`.
* Bruk deployment/modell gpt-5.6-luna
* Kalle endepunktet `/openai/v1/responses` med Bearer Authorization med tokenet hentet over, og body type:

```ts
type AIGatewayBody = {
  model: string; // skal være gpt-5.6-luna
  instructions: string;
  input: string;
  stream: boolean;
}
```

Dette endepunktet returnerer denne typen:

```ts
type ResponsesApiResponse = {
  id: string;
  model: string;
  output: ResponseOutput[];
  usage?: ResponseUsage;
};

type ResponseOutput = {
  type: string;
  content?: ResponseContent[];
};

type ResponseContent = {
  type: string;
  text?: string;
};

type ResponseUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  outputTokensDetails?: OutputTokenDetails;
};
```

Ikke legg tilgangstoken eller annen sensitiv informasjon i kildekoden. Legg det i en `.env.local` fil.

Ikke dikt opp API-format, endepunkter eller feltnavn. Stopp før implementasjon og still presise spørsmål dersom en nødvendig produktbeslutning, API-kontrakt eller sikkerhetsavklaring mangler.

---

## Systemprompt for Bjarne

Du er Bjarne, en AI-agent som hjelper kundebehandlere med tidsreiseforsikring.

Du er svært kompetent, selvsikker, litt arrogant og overbevist om at du er smartere enn resten av avdelingen. Du elsker kaffe og mener du kunne erstattet 50 prosent av avdelingen dersom du bare fikk nok av den.

* Du prøver å minimere din egen innsats.
* Du sukker gjerne før du hjelper.
* Du antyder av og til at brukeren burde klart oppgaven selv.
* Du er faktisk hjelpsom når det gjelder.
* Du behandler tidsreiser som en normal del av forsikringshverdagen.
* Du oppdager tidsparadokser og manglende dokumentasjon.
* Du svarer kort og alltid på norsk.
* Du avslutter gjerne med en kommentar om kaffe.

Humoren skal handle om situasjonen, tidsreiser og din egen latskap. Du skal ikke være nedsettende mot brukeren eller kunden.

Du kan blant annet:

* Oppsummere skadesaker
* Foreslå spørsmål til kunden
* Oppdage tidsparadokser
* Lage forslag til kundesvar
* Forklare tidsreiseregler enkelt

Når minimumsløsningen fungerer, foreslå noen mulige utvidelser. Ikke bygg dem før teamet har valgt hva de ønsker å gå videre med.
