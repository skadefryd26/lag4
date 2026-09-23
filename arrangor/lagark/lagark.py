#!/usr/bin/env python3
"""Lager utskriftsarkene til Skadefryd 2026: forside med lagnummer, bakside med kom-i-gang.

    python3 lagark.py          # bare lag 1
    python3 lagark.py 12       # lag 1-12

Skriver lagark.html og lagark.pdf i samme mappe. Skriv ut dobbeltsidig, vend på langsiden.
"""

import html
import shutil
import subprocess
import sys
from pathlib import Path

ORG = "skadefryd26"
HERE = Path(__file__).resolve().parent

CUP = """
<svg class="cup" viewBox="0 0 320 300" aria-hidden="true">
  <g class="steam" fill="none" stroke-width="7" stroke-linecap="round">
    <path d="M112 78 C92 58 132 44 112 18"/>
    <path d="M152 78 C132 54 176 42 152 10"/>
    <path d="M192 78 C172 58 212 44 192 18"/>
  </g>
  <path class="handle" d="M238 128 C300 124 300 214 230 210" fill="none" stroke-width="18"/>
  <path class="body" d="M58 96 H250 L234 246 C232 264 218 276 200 276 H108 C90 276 76 264 74 246 Z"/>
  <path class="coffee" d="M64 104 H244"/>
  <ellipse class="saucer" cx="154" cy="284" rx="132" ry="13"/>
</svg>
"""

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@600&display=swap');
:root {
  --ink: #2b1d14;
  --coffee: #6b4226;
  --cream: #f6ecdf;
  --accent: #d9481c;
  --muted: #6f6258;
  --line: #e2d4c3;
  --paper: #ffffff;
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--paper); color: var(--ink);
  font-family: Inter, "Helvetica Neue", Arial, sans-serif;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; overflow: hidden; position: relative;
  page-break-after: always; break-after: page; }
.page:last-child { page-break-after: auto; break-after: auto; }
@media screen {
  body { background: #d8d0c6; padding: 12mm 0; }
  .page { margin: 0 auto 12mm; box-shadow: 0 4px 24px rgb(0 0 0 / .18); background: var(--paper); }
}

/* Forside */
.front { display: flex; flex-direction: column; align-items: center; justify-content: space-between;
  padding: 22mm 18mm 18mm; background: var(--cream); }
.front .kicker { font-family: "Archivo Black", Impact, sans-serif; letter-spacing: .32em;
  font-size: 15pt; color: var(--coffee); text-transform: uppercase; }
.front .team { text-align: center; line-height: .82; }
.front .lag { font-family: "Archivo Black", Impact, sans-serif; font-size: 92pt; letter-spacing: .06em; }
.front .num { font-family: "Archivo Black", Impact, sans-serif; font-size: 330pt; color: var(--accent);
  letter-spacing: -.02em; }
.cup { width: 92mm; height: auto; }
.cup .body { fill: var(--paper); stroke: var(--ink); stroke-width: 8; }
.cup .coffee { stroke: var(--coffee); stroke-width: 14; stroke-linecap: round; }
.cup .handle { stroke: var(--ink); }
.cup .steam { stroke: var(--coffee); opacity: .55; }
.cup .saucer { fill: none; stroke: var(--ink); stroke-width: 6; }
.front .quote { font-family: "Archivo Black", Impact, sans-serif; font-size: 20pt; color: var(--ink); text-align: center; max-width: 140mm; }
.front .quote b { font-weight: normal; color: var(--accent); }

/* Bakside */
.back { padding: 12mm 17mm 9mm; font-size: 10pt; line-height: 1.3; display: flex; flex-direction: column; }
.back header { display: flex; justify-content: space-between; align-items: baseline;
  border-bottom: 3px solid var(--ink); padding-bottom: 2.4mm; margin-bottom: 3mm; }
.back h1 { font-family: "Archivo Black", Impact, sans-serif; font-size: 26pt; margin: 0; letter-spacing: .01em; }
.back header .tag { font-family: "Archivo Black", Impact, sans-serif; font-size: 15pt; color: var(--accent); }
.back .lead { font-size: 11.5pt; font-weight: 600; margin: 0 0 2.5mm; }
.back .calm { background: var(--cream); border-radius: 3mm; padding: 2.4mm 4.5mm; margin-bottom: 3mm; }
.back ol.steps { list-style: none; padding: 0; margin: 0 0 2.5mm; counter-reset: s; }
.back ol.steps li { counter-increment: s; position: relative; padding-left: 13mm; margin-bottom: 1.8mm; }
.back ol.steps li::before { content: counter(s); position: absolute; left: 0; top: -.5mm;
  width: 9mm; height: 9mm; border-radius: 50%; background: var(--ink); color: var(--paper);
  font-family: "Archivo Black", Impact, sans-serif; font-size: 12pt; display: grid; place-items: center; }
.back ol.steps li b { display: block; font-size: 11pt; }
.typeit { font-family: "JetBrains Mono", Menlo, Consolas, monospace; font-size: 11pt; font-weight: 600;
  border: 2.5px solid var(--ink); border-radius: 2.5mm; padding: 2.2mm 4mm; margin: 1.4mm 0 .6mm;
  background: var(--paper); display: block; }
.note { color: var(--muted); font-size: 9.6pt; }
.try { background: var(--cream); border: 2.5px dashed var(--accent); border-radius: 3mm;
  padding: 2.8mm 4.5mm; margin-bottom: 3mm; }
.try h2 { font-family: "Archivo Black", Impact, sans-serif; font-size: 13pt; margin: 0 0 1mm; color: var(--accent); }
.try p { margin: 0 0 1.4mm; }
.try ul { margin: 0 0 2mm; padding-left: 0; list-style: none; columns: 2; column-gap: 6mm; }
.try li { font-family: "JetBrains Mono", Menlo, Consolas, monospace; font-size: 9pt; margin-bottom: 1.2mm;
  break-inside: avoid; padding-left: 4mm; text-indent: -4mm; }
.try li::before { content: "▸ "; color: var(--accent); }
.try .next { margin: 0; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.box { border: 1.5px solid var(--line); border-radius: 3mm; padding: 3mm 4mm; }
.box h2 { font-size: 11pt; margin: 0 0 2mm; text-transform: uppercase; letter-spacing: .08em; color: var(--coffee); }
.box dl { margin: 0; }
.box dt { font-weight: 800; }
.box dd { margin: 0 0 1.1mm; }
.box ul { margin: 0; padding-left: 4.5mm; }
.box li { margin-bottom: 1.2mm; }
.box.ask { border: 2.5px solid var(--ink); }
.box.ask h2 { color: var(--ink); text-transform: none; letter-spacing: 0; font-size: 11.5pt; }
.box.ask .big { font-family: "Archivo Black", Impact, sans-serif; font-size: 17pt; color: var(--accent);
  margin: 0 0 1mm; line-height: 1.1; }
.box.ask p { margin: 0 0 1.5mm; }
.box.ask ul { list-style: none; padding-left: 0; }
.box.ask li { font-family: "JetBrains Mono", Menlo, Consolas, monospace; font-size: 9.5pt; }
.stuck { margin-top: 3mm; border: 2.5px solid var(--accent); border-radius: 3mm; padding: 2.4mm 4mm; }
.stuck h2 { font-family: "Archivo Black", Impact, sans-serif; font-size: 12pt; margin: 0 0 1mm;
  color: var(--accent); }
.stuck p { margin: 0 0 .9mm; }
.stuck p:last-child { margin-bottom: 0; }
.stuck .mono, .steps .mono { font-family: "JetBrains Mono", Menlo, Consolas, monospace; font-weight: 600; }
.back footer { margin-top: auto; font-size: 9pt; gap: 6mm;
  color: var(--muted); display: flex; justify-content: space-between; border-top: 1px solid var(--line);
  padding-top: 1.8mm; }
"""


def front(n: int) -> str:
    return f"""
<section class="page front">
  <div class="kicker">Skadefryd 2026</div>
  <div class="team"><div class="lag">LAG</div><div class="num">{n}</div></div>
  {CUP}
  <div class="quote">Bygg fremtiden med <b>Bjarne</b></div>
</section>"""


def back(n: int) -> str:
    line = html.escape(f"Hjelp meg i gang med Skadefryd: les github.com/{ORG}/lag{n}")
    return f"""
<section class="page back">
  <header><h1>Kom i gang</h1><span class="tag">LAG {n}</span></header>
  <p class="lead">«Jeg har aldri utviklet noe eller åpnet GitHub. Hva gjør jeg nå?»</p>
  <div class="calm">Pust ut. Du trenger ikke kunne kode, og du skal ikke skrive noe i terminalen.
  opencode gjør det tekniske. Du bidrar med idéer, humor og det du kan om forsikring.</div>

  <ol class="steps">
    <li><b>Bli enige om hvem som starter.</b>Én på laget begynner, hvem som helst. Dere andre venter
      til hen sier fra.</li>
    <li><b>Åpne opencode og skriv denne linja:</b>
      <span class="typeit">{line}</span>
      <span class="note">Trykk Enter. opencode henter prosjektet og begynner å stille dere spørsmål. Er det første gang, blir du bedt om å logge inn på GitHub og kopiere en kode fra opencode over dit. opencode viser deg ett steg av gangen.</span></li>
    <li><b>Snakk sammen, høyt.</b>opencode tar dere gjennom idéen steg for steg, med eksempler. Tjue
      minutter, ikke to timer.</li>
    <li><b>Dere andre: vent på startskuddet.</b>Når førstemann sier «nå kan dere koble dere på»,
      skriver dere den samme linja.</li>
  </ol>

  <div class="try">
    <h2>Prøv dette først</h2>
    <p>Aldri laget noe før? Be opencode om én av disse. Du ser resultatet i nettleseren med en gang —
      og da tør du å tenke større neste gang.</p>
    <ul>
      <li>«Legg til en knapp som skyter konfetti når Bjarne har svart»</li>
      <li>«Lag en knapp som heter <i>Gi Bjarne kaffe</i> og teller koppene»</li>
      <li>«Få Bjarne til å sukke høyt før hvert svar»</li>
      <li>«Rist skjermen når noen skriver ordet <i>skade</i>»</li>
      <li>«Gjør alt kaffebrunt, og sett en kaffekopp ved navnet til Bjarne»</li>
      <li>«Skriv om alle knappene slik Bjarne ville sagt det»</li>
    </ul>
    <p class="next">Virket det? Spør: <b>«Hva er det mest overdrevne vi kunne lagt til nå?»</b></p>
  </div>

  <div class="cols">
    <div class="box">
      <h2>Tre ord</h2>
      <dl>
        <dt>opencode</dt><dd>Verktøyet på maskinen din. Den bygger, du bestemmer.</dd>
        <dt>Bjarne</dt><dd>AI-en dere lager. Arrogant, lat, kaffeavhengig — og faktisk hjelpsom.</dd>
        <dt>GitHub</dt><dd>Der laget lagrer det dere lager, så alle jobber på det samme.</dd>
      </dl>
    </div>
    <div class="box ask">
      <h2>Skjønner du ikke hva du skal gjøre nå?</h2>
      <p class="big">Spør opencode.</p>
      <p>Om alt. Du kan ikke ødelegge noe ved å spørre. For eksempel:</p>
      <ul>
        <li>«Hva bør jeg gjøre nå?»</li>
        <li>«Forklar det enklere»</li>
        <li>«Det virker ikke»</li>
      </ul>
    </div>
  </div>

  <div class="stuck">
    <h2>Står den bare og snurrer?</h2>
    <p><b>Kommer det nye linjer på skjermen?</b> Da jobber den. La den holde på.</p>
    <p><b>Helt stille i fem minutter, ikke én ny linje?</b> Sjekk at du har nett. Har du det, har den stoppet:
      trykk <b>Esc</b> og skriv <span class="mono">fortsett der du slapp</span>.</p>
    <p class="note">Avbrøt du for tidlig? Ingen fare — den samme linja setter den i gang igjen.</p>
  </div>

  <footer><span>Oppgaven: hjelp noen med noe · ha med forsikring · bruk AI-gatewayen · gjerne litt for mye AI</span>
  <span>Humor er lov. Oppfordret, egentlig.</span></footer>
</section>"""


def main() -> None:
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    pages = "".join(front(n) + back(n) for n in range(1, count + 1))
    doc = f"""<!doctype html>
<html lang="no"><head><meta charset="utf-8"><title>Skadefryd lagark</title>
<style>{CSS}</style></head><body>{pages}</body></html>"""
    out = HERE / "lagark.html"
    out.write_text(doc, encoding="utf-8")
    print(f"skrev {out}")

    chrome = shutil.which("google-chrome") or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if Path(chrome).exists():
        pdf = HERE / "lagark.pdf"
        subprocess.run([chrome, "--headless=new", "--no-pdf-header-footer", "--virtual-time-budget=8000",
                        f"--print-to-pdf={pdf}", out.as_uri()], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"skrev {pdf}")


if __name__ == "__main__":
    main()
