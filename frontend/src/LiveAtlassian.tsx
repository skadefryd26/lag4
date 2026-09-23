import { useState } from 'react';
import { Badge, Button } from '@mantine/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { request } from './api';
import './atlassian.css';

type Connection = { state: 'connected' | 'connecting' | 'disconnected' | 'error'; site: string; error?: string };
type LiveSource = { kind: 'jira' | 'confluence'; title: string; url: string };
type LiveAnswer = { answer: string; state: 'sources' | 'unknown'; sources: LiveSource[]; mode: 'live-atlassian' };

export function LiveAtlassian() {
  const [question, setQuestion] = useState('Who owns claims-selector?');
  const connection = useQuery({
    queryKey: ['atlassian-connection'],
    queryFn: () => request<Connection>('/api/atlassian/connect', {}),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const ask = useMutation({
    mutationFn: (value: string) => request<LiveAnswer>('/api/ask', { question: value }),
  });
  const connected = !connection.isError && connection.data?.state === 'connected';

  return <main className="live-shell">
    <header className="live-header"><span className="live-wordmark">Gjensidige <span>/ Claims Tribe</span></span><Badge color="indigo" variant="light">LOCAL · READ ONLY</Badge></header>
    <div className="live-content">
      <div className="live-hero"><p className="live-eyebrow">CLAIMS TRIBE · LIVE FIELD GUIDE</p><h1>Ask Bjarne.<br/><em>Show the sources.</em></h1><p>Search the Jira and Confluence sources you can access, directly through Atlassian Rovo MCP. Bjarne shows his working instead of inventing an owner.</p></div>
      <section className="live-card" aria-labelledby="live-heading">
        <div className="live-card-heading"><div><p className="live-eyebrow">ASK BJARNE</p><h2 id="live-heading">What are you looking for?</h2></div><span aria-hidden="true" className="live-coffee">☕</span></div>
        {connection.isPending && <p role="status" className="live-status">Opening Atlassian sign-in in your browser. Approve access there once; I will wait.</p>}
        {connection.isError && <div role="alert" className="live-error"><p>{connection.error.message}</p><Button variant="outline" onClick={() => void connection.refetch()}>Try connecting again</Button></div>}
        {connected && connection.data && <div role="status" className="live-status"><Badge color="green">Connected</Badge> Searching {connection.data.site} with your permissions.</div>}
        <form onSubmit={(event) => { event.preventDefault(); if (question.trim() && connected) ask.mutate(question.trim()); }}>
          <label htmlFor="live-question">Ask about a squad, application, or Jira issue</label>
          <div className="live-search-row"><input id="live-question" maxLength={500} required value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Who owns claims-selector?" /><Button type="submit" disabled={!connected || ask.isPending}>Search live sources</Button></div>
        </form>
        {ask.isPending && <p role="status" className="live-status">Bjarne is checking Jira and Confluence. A thorough sigh takes a moment.</p>}
        {ask.isError && <div role="alert" className="live-error"><p>{ask.error.message}</p><Button variant="outline" onClick={() => void connection.refetch()}>Reconnect Atlassian</Button></div>}
        {ask.data && <div className="live-answer" aria-live="polite"><Badge color={ask.data.state === 'sources' ? 'blue' : 'yellow'}>{ask.data.state === 'sources' ? 'Live sources' : 'No sources'}</Badge><p>{ask.data.answer}</p>{ask.data.sources.length > 0 && <ul>{ask.data.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} <span aria-hidden="true">↗</span></a><small>{source.kind === 'jira' ? 'Jira' : 'Confluence'} · open to verify the detail</small></li>)}</ul>}</div>}
      </section>
      <p className="live-note">Search for systems and squads, not customer, claim or employee details. This reads only what your Atlassian account permits. It does not change work items, store a copy in Git, or send results to the AI gateway. A submitted search may consume Rovo credits.</p>
    </div>
    <footer className="live-footer">One user · this machine only · live Atlassian sources</footer>
  </main>;
}
