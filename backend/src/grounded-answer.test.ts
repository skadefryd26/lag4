import assert from 'node:assert/strict';
import { test } from 'node:test';
import { composeGroundedAnswer } from './grounded-answer.js';
import type { SearchHit, SearchMatches } from './atlassian.js';

const source = (key: string, snippet: string): SearchHit => ({
  source: { kind: 'jira', title: `Jira ${key}`, url: `https://example.atlassian.net/browse/${key}` },
  title: 'claims-selector',
  snippet,
});
const matches = (...hits: SearchHit[]): SearchMatches => ({ hits, hasMore: false, partial: false });

test('answers an ownership question using cited fictional excerpts', () => {
  const answer = composeGroundedAnswer('Who owns claims-selector?', matches(
    source('DEMO-1', 'Squad New owns claims-selector. It routes fictional intake work.'),
    source('DEMO-2', 'The claims-selector routes applications to the next step.'),
  ));
  assert.equal(answer.state, 'sources');
  assert.equal(answer.mode, 'live-atlassian');
  assert.match(answer.answer, /Squad New.*owner \[1\]/);
  assert.match(answer.answer, /Squad New owns claims-selector.*\[1\]/);
  assert.match(answer.answer, /routes applications.*\[2\]/);
  assert.deepEqual(answer.sources.map((item) => item.url), [
    'https://example.atlassian.net/browse/DEMO-1',
    'https://example.atlassian.net/browse/DEMO-2',
  ]);
});

test('contradicting and missing ownership never become a confident answer', () => {
  const conflict = composeGroundedAnswer('Who owns claims-selector?', matches(
    source('DEMO-1', 'Owner: Squad New. The claims-selector handles intake.'),
    source('DEMO-2', 'Owner: Squad Cash. The claims-selector handles routing.'),
  ));
  assert.equal(conflict.state, 'unknown');
  assert.match(conflict.answer, /disagree about ownership/);
  assert.match(conflict.answer, /\[1\]/);
  assert.match(conflict.answer, /\[2\]/);

  const unclear = composeGroundedAnswer('Who owns claims-selector?', matches(
    source('DEMO-3', 'The claims-selector handles intake, but its owner is unconfirmed.'),
  ));
  assert.equal(unclear.state, 'unknown');
  assert.doesNotMatch(unclear.answer, /names .* as an owner/);
  assert.equal(composeGroundedAnswer('Who owns claims-selector?', matches()).sources.length, 0);

  const delayedConflict = composeGroundedAnswer('Who owns claims-selector?', matches(
    source('DEMO-1', 'Owner: Squad New. The claims-selector handles intake.'),
    source('DEMO-2', 'Owner: Squad New. The claims-selector handles routing.'),
    source('DEMO-3', 'Owner: Squad New. The claims-selector handles triage.'),
    source('DEMO-4', 'Owner: Squad Cash. The claims-selector handles triage.'),
  ));
  assert.equal(delayedConflict.state, 'unknown');
  assert.ok(delayedConflict.sources.some((item) => item.url.endsWith('DEMO-4')));
});

test('never treats a title match alone as evidence, and reports partial results', () => {
  const answer = composeGroundedAnswer('Who owns claims-selector?', {
    hits: [source('DEMO-4', 'Someone mentioned coffee yesterday.')],
    hasMore: true, partial: true,
  });
  assert.equal(answer.state, 'unknown');
  assert.match(answer.answer, /do not provide enough relevant text/);
  assert.match(answer.answer, /More search results exist/);
  assert.match(answer.answer, /incomplete search/);
  assert.doesNotMatch(answer.answer, /coffee/);
  assert.equal(answer.sources.length, 1);
});

test('uses relevant excerpts for a general question without exposing markup or raw links', () => {
  const answer = composeGroundedAnswer('What does claims-selector do?', matches(
    source('DEMO-5', 'The <strong>claims-selector</strong> routes fictional intake work. More detail: https://example.com/private?token=fictional'),
  ));
  assert.equal(answer.state, 'sources');
  assert.match(answer.answer, /routes fictional intake work.*\[1\]/);
  assert.doesNotMatch(answer.answer, /<strong>|example\.com|token=/);
});
