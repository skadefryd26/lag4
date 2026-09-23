import { useState } from 'react';

type ClaimStatus = 'open' | 'warning' | 'collections' | 'settled';

type Claim = {
  id: number;
  name: string;
  team: string;
  incidentDate: string;
  status: ClaimStatus;
  note: string;
};

const initialClaims: Claim[] = [
  { id: 1, name: 'Oda Overivrig', team: 'Skadeplattform', incidentDate: '2026-08-16', status: 'collections', note: 'Fristen gikk ut mens Oda antakeligvis stolte på at historikken slettet seg selv.' },
  { id: 2, name: 'Peder Pult', team: 'Erstatningsorkesteret', incidentDate: '2026-08-23', status: 'collections', note: 'Saken er nå dobbelt opp. Kalenderen har dessverre ingen empati.' },
  { id: 3, name: 'Nora Nøkkel', team: 'Vilkårsvakten', incidentDate: '2026-09-04', status: 'warning', note: 'To uker igjen. Bjarne har allerede funnet frem den passive aggressive brevmalen.' },
  { id: 4, name: 'Tobias Tastatur', team: 'Skadeanalyse', incidentDate: '2026-09-12', status: 'open', note: 'Saken er ny. Vi later foreløpig som om dette kan løses uten inkasso.' },
  { id: 5, name: 'Linn Lås', team: 'Kundeoppgjør', incidentDate: '2026-08-09', status: 'settled', note: 'Oppgjør godkjent. Bakverket var forsvarlig, og tilliten er under behandling.' },
];

const statusLabel: Record<ClaimStatus, string> = {
  open: 'Åpen bollesak',
  warning: 'Frist nærmer seg',
  collections: 'Bolleinkasso',
  settled: 'Oppgjort',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function calculateStatus(incidentDate: string): ClaimStatus {
  const age = Math.floor((Date.now() - new Date(`${incidentDate}T12:00:00`).getTime()) / 86_400_000);
  if (age > 28) return 'collections';
  if (age > 14) return 'warning';
  return 'open';
}

export function Bolleforsikring() {
  const [claims, setClaims] = useState(initialClaims);
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('To saker har passert fristen. Jeg har klargjort inkassobrev og et svært skuffet blikk.');
  const activeClaims = claims.filter((claim) => claim.status !== 'settled');
  const collectionCount = claims.filter((claim) => claim.status === 'collections').length;

  function settleClaim(claim: Claim) {
    setClaims((current) => current.map((item) => item.id === claim.id ? { ...item, status: 'settled', note: 'Oppgjør registrert. Ikke fordi jeg er imponert, men fordi bakverket var forsvarlig.' } : item));
    setMessage(`${claim.name} er registrert som oppgjort. Tillit er fortsatt under behandling.`);
  }

  function registerClaim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !team.trim()) return;
    const incidentDate = new Date().toISOString().slice(0, 10);
    setClaims((current) => [{ id: Date.now(), name: name.trim(), team: team.trim(), incidentDate, status: calculateStatus(incidentDate), note: 'Ny sak registrert. Skjermlåsen var tydeligvis på en uplanlagt pause.' }, ...current]);
    setMessage(`Ny bollesak for ${name.trim()} er registrert. Jeg har motvillig opprettet dokumentasjonen.`);
    setName('');
    setTeam('');
    setShowForm(false);
  }

  return <section className="bowl-page" aria-labelledby="bowl-title">
    <div className="bowl-hero">
      <div><p className="eyebrow">BJARNES INTERNE VERKTOYKASSE</p><h1 id="bowl-title">Bolleforsikring</h1><p className="bowl-lede">Intern skadeforebygging og oppgjør for ulåste maskiner. Vi dekker ingenting. Men vi husker alt.</p></div>
      <div className="bjarne-seal" aria-label="Bjarne, sjef for Bolleinkasso"><span aria-hidden="true">B</span><small>Saksbehandler<br />mot sin vilje</small></div>
    </div>

    <div className="bowl-alert" role="status"><strong>Bjarne varsler:</strong> {message}</div>
    <div className="bowl-stats" aria-label="Status for bollesaker">
      <div><span>{activeClaims.length}</span><small>Åpne saker</small></div>
      <div className="warning-stat"><span>{claims.filter((claim) => claim.status === 'warning').length}</span><small>Frist nærmer seg</small></div>
      <div className="collections-stat"><span>{collectionCount}</span><small>Hos Bolleinkasso</small></div>
      <div><span>{claims.filter((claim) => claim.status === 'settled').length}</span><small>Oppgjør godkjent motvillig</small></div>
    </div>

    <div className="bowl-toolbar"><div><p className="eyebrow">OFFENTLIG SAKSPORTFOLJE</p><h2>Alle vet. Ingen glemmer.</h2></div><button className="bowl-primary" onClick={() => setShowForm((value) => !value)}>{showForm ? 'Lukk registrering' : 'Registrer bollesak'}</button></div>
    {showForm && <form className="claim-form" onSubmit={registerClaim}><label>Oppdiktet navn<input value={name} onChange={(event) => setName(event.target.value)} placeholder="For eksempel Kari Kanel" maxLength={60} required /></label><label>Oppdiktet avdeling<input value={team} onChange={(event) => setTeam(event.target.value)} placeholder="For eksempel Risiko og ror" maxLength={60} required /></label><button className="bowl-primary" type="submit">Opprett sak</button></form>}

    <div className="claim-grid">{claims.map((claim) => <article className={`claim-card ${claim.status}`} key={claim.id}>
      <div className="claim-heading"><span className={`claim-status ${claim.status}`}>{statusLabel[claim.status]}</span>{claim.status === 'collections' && <span className="double-stamp">DOBBELT OPP</span>}</div>
      <h3>{claim.name}</h3><p className="claim-team">{claim.team}</p>
      <dl><div><dt>Hendelse registrert</dt><dd>{formatDate(claim.incidentDate)}</dd></div><div><dt>Risikovurdering</dt><dd>{claim.status === 'collections' ? 'Kritisk: fristen ble behandlet som et forslag.' : 'Forhøyet: skjermlås er fortsatt frivillig i praksis.'}</dd></div></dl>
      <p className="bjarne-note"><span aria-hidden="true">“</span>{claim.note}</p>
      {claim.status !== 'settled' ? <button className="settle-button" onClick={() => settleClaim(claim)}>Boller mottatt</button> : <span className="settled-mark">Oppgjør akseptert</span>}
    </article>)}</div>
    <p className="bowl-disclaimer">Demoversjon med oppdiktede personer og hendelser. Ingen kolleger ble hengt ut under saksbehandlingen.</p>
  </section>;
}
