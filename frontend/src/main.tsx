import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import { createRootRoute, createRoute, createRouter, RouterProvider, useNavigate, useRouterState } from '@tanstack/react-router';
import { Badge, Button, Text } from '@gjensidige/builders-components';
import '@gjensidige/builders-components/dist/style.css';
import '@gjensidige/builders-fonts/dist/fonts.css';
import '@gjensidige/builders-tokens/dist/tokens.css';
import '@mantine/core/styles.css';
import './styles.css';

type Source = { id: string; title: string; kind: string; url: string; updated: string };
type Squad = { id: string; name: string; aliases?: string[]; tagline: string; mission: string; domain: string; apps: string[]; systems: string[]; work: string[]; leaders: string[]; members?: string[]; contacts: string[]; refs: string[]; conflicts: string[] };
type Tribe = { asOf: string; demonstration: boolean; squads: Squad[]; sources: Source[]; slack: { connected: boolean; channel: string | null; trigger: string | null; action: string | null } };
type Answer = { answer: string; squadId: string | null; sources: Source[]; state: 'supported' | 'provisional' | 'unclear' | 'unknown'; mode: string };
type Brief = { text: string; sources: Source[]; warning: string };

async function request<T>(path: string, data?: object): Promise<T> {
  const response = await fetch(path, data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : undefined);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? 'Request failed.');
  return body as T;
}

const client = new QueryClient();
const rootRoute = createRootRoute({ component: Shell });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Overview });
const squadRoute = createRoute({ getParentRoute: () => rootRoute, path: '/squad/$squadId', component: SquadView });
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute, squadRoute]) });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }

function Sources({ sources }: { sources: Source[] }) {
  if (!sources.length) return <Text size="small">No verified source available for this claim.</Text>;
  return <ul className="source-list">{sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} <span aria-hidden="true">↗</span></a><span className="source-date">{source.kind} · updated {source.updated === 'unknown' ? 'date unavailable' : source.updated}</span></li>)}</ul>;
}

function FactList({ title, entries, empty = 'No verified detail in this snapshot.' }: { title: string; entries: string[]; empty?: string }) {
  return <section className="fact"><h3>{title}</h3>{entries.length ? <ul>{entries.map((entry) => <li key={entry}>{entry}</li>)}</ul> : <p className="muted">{empty}</p>}</section>;
}

function Shell() {
  const { data, error, isPending } = useQuery({ queryKey: ['tribe'], queryFn: () => request<Tribe>('/api/tribe') });
  const navigate = useNavigate();
  const [question, setQuestion] = useState('Who owns claims-selector?');
  const ask = useMutation({ mutationFn: (value: string) => request<Answer>('/api/ask', { question: value }) });
  const [surprise, setSurprise] = useState(false);
  return <main className="shell">
    <header className="topbar"><a href="/" className="wordmark" onClick={(event) => { event.preventDefault(); void navigate({ to: '/' }); }}>Gjensidige <span> / Claims Tribe</span></a><span className="eyebrow">FIELD GUIDE · RESEARCH PREVIEW</span></header>
    <div className="notice" role="status">Local research demonstration. Source access reflects the researcher, not every future viewer. Never share this screen or publish this snapshot without per-user authorization.</div>
    {isPending && <p role="status">Checking the evidence…</p>}
    {error && <p role="alert">{error.message}</p>}
    {data && <>
      <div className="content">
        <section className="hero" aria-labelledby="page-title"><p className="eyebrow">YOUR FIRST WEEK, EXPLAINED</p><h1 id="page-title">Meet the nine squads<br/><em>behind every claim.</em></h1><p>One tribe, many specialisms. Follow the introduction, explore a squad, or ask a specific ownership question. Every answer has a trail back to its source.</p><span className="date-chip">Source snapshot · {data.asOf}</span></section>
        <RouterProviderContent data={data} />
        <section className="assistant-panel" aria-label="Ask about the tribe"><div><p className="eyebrow">ASK BJARNE · EVIDENCE FIRST</p><h2>Who owns what?</h2><p>Bjarne checks the references before he makes a claim. A revolutionary approach, apparently.</p></div>
          <form onSubmit={(event) => { event.preventDefault(); if (question.trim()) ask.mutate(question.trim()); }}>
            <label htmlFor="question">Ask about a squad, application or contact</label><div className="search-row"><input id="question" maxLength={500} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Who owns claims-selector?" required /><Button variant="primary" type="submit">Find answer</Button></div>
          </form>
          {ask.isPending && <p role="status">Bjarne is checking the source links. Reluctantly.</p>}
          {ask.isError && <p role="alert">{ask.error.message}</p>}
          {ask.data && <div className="answer" aria-live="polite"><Badge severity={ask.data.state === 'supported' ? 'success' : 'warning'}>{ask.data.state}</Badge><p>{ask.data.answer}</p>{ask.data.squadId && <button className="text-link" onClick={() => void navigate({ to: '/squad/$squadId', params: { squadId: ask.data!.squadId! } })}>Explore squad →</button>}<details><summary>Evidence & update dates</summary><Sources sources={ask.data.sources}/></details></div>}
        </section>
        <section className="slack-section" aria-label="Slack surprise"><p className="eyebrow">THE WATERCOOLER</p><h2>A very serious Slack surprise</h2><p>Slack is not connected. Channel and trigger are still TBD; the button below demonstrates only the on-screen effect. It reads or posts nothing.</p><Button variant="secondary" onClick={() => setSurprise((value) => !value)}>{surprise ? 'Hide simulated surprise' : 'Preview simulated surprise'}</Button>{surprise && <div role="status" className="surprise"><span aria-hidden="true">☕ ✦ ☕</span><p>“I have reviewed all nine squads. I am requesting nine coffees.” — Bjarne</p><small>SIMULATED · no Slack message read or sent</small></div>}</section>
      </div><footer>Built from permission-sensitive sources · missing facts stay missing · last checked {data.asOf}</footer>
    </>}
  </main>;
}

// Router context is shared through TanStack Query; this component makes the existing
// index / squad routes available without fetching source data into static assets.
function RouterProviderContent({ data }: { data: Tribe }) {
  const route = useRouterState({ select: (state) => state.location.pathname });
  if (route.startsWith('/squad/')) {
    const id = decodeURIComponent(route.slice('/squad/'.length));
    return <SquadContent data={data} id={id} />;
  }
  return <OverviewContent data={data} />;
}
function Overview() { return null; }
function SquadView() { return null; }

function OverviewContent({ data }: { data: Tribe }) {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const squad = data.squads[slide];
  const change = (delta: number) => setSlide((current) => (current + delta + data.squads.length) % data.squads.length);
  return <>
    <section className="presentation" aria-label="Squad introduction slides"><div className="section-header"><span className="eyebrow">THE INTRODUCTION · {String(slide + 1).padStart(2, '0')} / 09</span><span>Use the controls or left and right arrow keys</span></div><div className="slide" tabIndex={0} onKeyDown={(event) => { if (event.key === 'ArrowRight') change(1); if (event.key === 'ArrowLeft') change(-1); }}><span className="slide-number">{String(slide + 1).padStart(2, '0')}</span><div><p className="eyebrow">SQUAD SPOTLIGHT</p><h2>{squad.name}</h2><p className="slide-tagline">{squad.tagline}</p><p className="slide-copy">{squad.mission}</p>{squad.aliases?.length ? <p className="aliases">Also called: {squad.aliases.join(', ')}</p> : null}<button className="slide-link" onClick={() => void navigate({ to: '/squad/$squadId', params: { squadId: squad.id } })}>Explore {squad.name} <span aria-hidden="true">↗</span></button></div></div><div className="slide-controls"><button onClick={() => change(-1)} aria-label="Previous squad">← Previous</button><div role="group" aria-label="Choose squad slide" className="dots">{data.squads.map((item, index) => <button key={item.id} className={index === slide ? 'active' : ''} onClick={() => setSlide(index)} aria-label={`Slide ${index + 1}: ${item.name}`} aria-current={index === slide ? 'step' : undefined} />)}</div><button onClick={() => change(1)} aria-label="Next squad">Next →</button></div></section>
    <section className="directory" aria-labelledby="directory-heading"><p className="eyebrow">EXPLORE THE TRIBE</p><h2 id="directory-heading">Find your people and platforms.</h2><div className="squad-grid">{data.squads.map((item, index) => <button className="squad-card" key={item.id} onClick={() => void navigate({ to: '/squad/$squadId', params: { squadId: item.id } })}><span>{String(index + 1).padStart(2, '0')} / 09</span><strong>{item.name}</strong><small>{item.tagline}</small><span className="card-arrow" aria-hidden="true">↗</span></button>)}</div></section>
  </>;
}

function SquadContent({ data, id }: { data: Tribe; id: string }) {
  const navigate = useNavigate();
  const squad = data.squads.find((item) => item.id === id);
  const brief = useMutation({ mutationFn: () => request<Brief>('/api/brief', { squadId: id }) });
  if (!squad) return <section className="detail"><h2>Squad not found</h2><button className="text-link" onClick={() => void navigate({ to: '/' })}>Back to overview</button></section>;
  return <article className="detail"><button className="text-link" onClick={() => void navigate({ to: '/' })}>← All nine squads</button><p className="eyebrow">SQUAD DEEP DIVE</p><h2>{squad.name}</h2><p className="detail-lede">{squad.mission}</p>{squad.aliases?.length ? <p className="aliases">Also called: {squad.aliases.join(', ')}</p> : null}<div className="detail-grid"><div><FactList title="Domain" entries={[squad.domain]}/><FactList title="Applications" entries={squad.apps}/><FactList title="Systems & integrations" entries={squad.systems}/><FactList title="Current work" entries={squad.work}/></div><div><FactList title="Leadership & key people" entries={squad.leaders}/><FactList title="Other documented members" entries={squad.members ?? []}/><FactList title="How to reach them" entries={squad.contacts}/>{squad.conflicts.length > 0 && <section className="caution"><h3>Needs a closer look</h3><ul>{squad.conflicts.map((issue) => <li key={issue}>{issue}</li>)}</ul></section>}</div></div><details open className="source-details"><summary>View source trail & update dates</summary><Sources sources={data.sources.filter((source) => squad.refs.includes(source.id))}/></details><div className="ai-brief"><h3>Bjarne’s short briefing</h3><p>An AI-generated summary of the linked evidence. Check important claims against the sources below.</p><Button variant="secondary" onClick={() => brief.mutate()}>Ask Bjarne for a briefing</Button>{brief.isPending && <p role="status">Bjarne is considering doing the work…</p>}{brief.isError && <p role="alert">{brief.error.message}</p>}{brief.data && <div role="status"><p>{brief.data.text}</p><small>{brief.data.warning}</small><Sources sources={brief.data.sources}/></div>}</div></article>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><MantineProvider><QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider></MantineProvider></React.StrictMode>);
