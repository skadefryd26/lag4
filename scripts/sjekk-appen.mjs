#!/usr/bin/env node
// Åpner appen i en ekte nettleser og sier fra om deltakeren vil se noe eller en feil.
//
//   node scripts/sjekk-appen.mjs http://localhost:5173
//
// En dev-server svarer 200 på index.html selv når appen krasjer i nettleseren, så
// «serveren svarer» er ikke det samme som «det står noe på skjermen». Denne henter
// siden slik deltakeren får den: kjører JavaScripten, fanger feil i konsollen, feilede
// API-kall og Vite sin røde feilskjerm, og sjekker at det faktisk er tekst på siden.
//
// Avslutter med 0 bare når siden er ren. Ellers skriver den hva som er galt, og
// legger igjen et skjermbilde du kan se på.
//
// Bruker nettleseren som allerede er på maskinen (Chrome, ellers Edge), så det er
// ingenting stort å laste ned. Mangler begge, faller den tilbake til Playwrights egen.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const url = process.argv[2];
if (!url) {
  console.error("Bruk: node scripts/sjekk-appen.mjs <adressen dev-serveren skrev ut>");
  process.exit(2);
}

let chromium;
{
  // Pakka er CommonJS: hentet som fil-URL ligger den under .default.
  const hent = async (spec) => {
    const m = await import(spec);
    return m.chromium ?? m.default?.chromium;
  };
  try {
    chromium = await hent("playwright-core");
  } catch {
    // Scriptet kan ligge et annet sted enn prosjektet det sjekker. Let der kommandoen kjøres fra også.
    try {
      const krev = createRequire(join(process.cwd(), "package.json"));
      chromium = await hent(pathToFileURL(krev.resolve("playwright-core")).href);
    } catch {
      // håndteres under
    }
  }
  if (!chromium) {
    console.error(
      "playwright-core mangler. Installer den først:\n\n  npm install --save-dev playwright-core\n"
    );
    process.exit(2);
  }
}

const skjermbilde = join(process.cwd(), "sjekk-appen.png");

async function startNettleser() {
  const grunner = [];
  for (const channel of ["chrome", "msedge", undefined]) {
    try {
      return await chromium.launch(channel ? { channel, headless: true } : { headless: true });
    } catch (e) {
      grunner.push(`${channel ?? "playwrights egen"}: ${e.message.split("\n")[0]}`);
    }
  }
  console.error("Fant ingen nettleser å teste med:\n");
  for (const g of grunner) console.error(`  - ${g}`);
  console.error(
    "\nHar maskinen verken Chrome eller Edge, installer Playwrights egen:\n\n" +
      "  npm install --save-dev playwright && npx playwright install chromium\n"
  );
  process.exit(2);
}

const browser = await startNettleser();
const page = await browser.newPage();

const feil = [];
const daarligeSvar = new Set();

// Et manglende favicon er ikke en feil deltakeren kan se.
const uinteressant = (u) => /\/favicon\.[a-z0-9]+(\?|$)/i.test(u);

page.on("pageerror", (e) => feil.push(`JavaScript-feil: ${e.message.split("\n")[0]}`));
page.on("console", (m) => {
  // «Failed to load resource» sier ikke hvilken — svaret under fanger den med adresse.
  if (m.type() === "error" && !m.text().startsWith("Failed to load resource")) {
    feil.push(`Feil i konsollen: ${m.text()}`);
  }
});
page.on("response", (r) => {
  if (r.status() >= 400 && !uinteressant(r.url())) {
    daarligeSvar.add(r.url());
    feil.push(`${r.status()} fra ${r.url()}`);
  }
});
page.on("requestfailed", (r) => {
  // En avbrutt forespørsel etter en 404 er den samme feilen en gang til, og
  // selve siden rapporteres av goto under.
  if (uinteressant(r.url()) || daarligeSvar.has(r.url()) || r.url() === url) return;
  feil.push(`Kallet til ${r.url()} kom aldri fram: ${r.failure()?.errorText ?? "ukjent grunn"}`);
});

let svarte = true;
try {
  const res = await page.goto(url, { waitUntil: "load", timeout: 30000 });
  if (!res) feil.push(`Fikk ikke svar fra ${url}.`);
} catch (e) {
  svarte = false;
  const hvorfor = e.message.split("\n")[0];
  feil.push(
    /ERR_CONNECTION_REFUSED/.test(hvorfor)
      ? `Ingenting svarer på ${url}. Kjører dev-serveren, og er dette adressen den skrev ut?`
      : `Nådde ikke ${url}: ${hvorfor}`
  );
}

let tekst = "";
let overlay = false;
if (svarte) {
  // React rekker ikke alltid å tegne før load. Vent på tekst, men ikke lenge.
  try {
    // Signaturen er (funksjon, argument, valg) — timeout som andre argument blir stille ignorert.
    await page.waitForFunction(
      () => (document.body.innerText || "").trim().length > 0,
      undefined,
      { timeout: 5000 }
    );
  } catch {
    // tomt er et funn, ikke en feil her
  }
  tekst = (await page.evaluate(() => (document.body.innerText || "").trim())) || "";
  overlay = await page.evaluate(
    () => !!document.querySelector("vite-error-overlay, #vite-error-overlay")
  );
  if (overlay) feil.push("Vite viser den røde feilskjermen — appen kompilerer ikke.");
  if (!tekst) feil.push("Siden er blank: det er ikke én synlig bokstav i den.");

  try {
    writeFileSync(skjermbilde, await page.screenshot({ fullPage: true }));
  } catch {
    // skjermbilde er en bonus, ikke et krav
  }
}

await browser.close();

// Samme feil gjentas gjerne per render.
const unike = [...new Set(feil)];

if (unike.length === 0) {
  console.log(`Appen er oppe på ${url}.`);
  console.log(`Det første deltakeren ser: ${tekst.split("\n")[0].slice(0, 80)}`);
  console.log(`Skjermbilde: ${skjermbilde}`);
  process.exit(0);
}

console.error(`Appen på ${url} er IKKE klar til å vises fram. ${unike.length} funn:\n`);
for (const f of unike) console.error(`  - ${f}`);
if (svarte) console.error(`\nSkjermbilde av det deltakeren ville sett: ${skjermbilde}`);
console.error("\nFiks dette før du sier noe til deltakeren.");
process.exit(1);
