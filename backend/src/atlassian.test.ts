import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AtlassianMcpError, cloudIdForSite, matchesFromSearch, sourcesFromSearch } from './atlassian.js';

const site = 'https://gjensidige.atlassian.net';

test('selects only the authorized site from MCP resources', () => {
  const resources = { content: [{ type: 'text', text: JSON.stringify([
    { id: 'other', url: 'https://other.atlassian.net', scopes: ['read:jira-work'] },
    { id: 'our-site', url: site, scopes: ['read:jira-work'] },
  ]) }] };
  assert.equal(cloudIdForSite(resources, site), 'our-site');
  assert.equal(cloudIdForSite({ content: [{ type: 'text', text: JSON.stringify({
    data: { resources: [{ cloudId: 'live-site', url: site, products: ['jira', 'confluence'] }] },
  }) }] }, site), 'live-site');
  assert.throws(
    () => cloudIdForSite(resources, 'https://missing.atlassian.net'),
    (error) => error instanceof AtlassianMcpError && /no authorized access/.test(error.message),
  );
});

test('returns only linked Jira and Confluence sources at this site', () => {
  const result = { content: [{ type: 'text', text: JSON.stringify({
    results: [
      { url: `${site}/browse/DEMO-12?token=never-share`, title: 'Fictional issue', snippet: 'Squad New owns the fictional claims-selector.' },
      { url: `${site}/wiki/spaces/DEMO/pages/12345/Guide`, title: 'Fictional guide', snippet: 'A fictional onboarding guide.' },
      { url: 'https://other.atlassian.net/browse/OTHER-1' },
      { url: 'https://example.com/elsewhere' },
      { url: `${site}/browse/DEMO-12` },
    ],
  }) }] };
  assert.deepEqual(sourcesFromSearch(result, site), [
    { kind: 'jira', title: 'Jira DEMO-12', url: `${site}/browse/DEMO-12` },
    { kind: 'confluence', title: 'Confluence page 12345', url: `${site}/wiki/spaces/DEMO/pages/12345` },
  ]);
  assert.equal(matchesFromSearch(result, site).hits[0].snippet, 'Squad New owns the fictional claims-selector.');
});

test('distinguishes an empty result from MCP errors and unlinked content', () => {
  assert.deepEqual(sourcesFromSearch({ structuredContent: { results: [] } }, site), []);
  assert.deepEqual(sourcesFromSearch({ structuredContent: { results: [{ url: 'https://example.com/unrelated' }] } }, site), []);
  assert.throws(
    () => sourcesFromSearch({ isError: true, content: [{ type: 'text', text: 'private data' }] }, site),
    (error) => error instanceof AtlassianMcpError && !error.message.includes('private data'),
  );
  assert.throws(
    () => sourcesFromSearch({ content: [{ type: 'text', text: 'Unlinked content' }] }, site),
    (error) => error instanceof AtlassianMcpError && /without usable/.test(error.message),
  );
});
