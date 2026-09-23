#!/usr/bin/env node
// Holder lagets GitHub Project-board i takt med issues og pull requests.
// Kjøres av workflowen .github/workflows/board.yml ved hver endring, og av
// arrangørene fra scripts/opprett-lag.sh. Trenger bare node og gh.
//
//   node .github/skills/skadefryd-tasks/board.mjs ensure
//   node .github/skills/skadefryd-tasks/board.mjs sync
//
// Repoet hentes fra GH_REPO (f.eks. skadefryd26/lag3), ellers fra mappa det
// kjøres i. Tokenet må ha project-tilgang.
//
// Boardet leses ut fra issues og pull requests, aldri omvendt. Kolonnen til en
// oppgave bestemmes av laneFor() under, så det finnes ingen «flytt»-kommando:
// endre issuet, og kjør sync.

import { execFileSync } from "node:child_process";

const ORG = "skadefryd26";
const LANES = [
  { name: "Idé", color: "GRAY", description: "Nevnt, ikke avklart ennå" },
  { name: "Klar", color: "BLUE", description: "Spørsmålene er stilt, oppgaven er definert" },
  { name: "Under arbeid", color: "YELLOW", description: "Noen jobber med den" },
  { name: "Review", color: "ORANGE", description: "Venter på laget, PR er åpen" },
  { name: "Ferdig", color: "GREEN", description: "Merget til main" },
];

function gh(args, input) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    input,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function graphql(query, variables) {
  const out = gh(["api", "graphql", "--input", "-"], JSON.stringify({ query, variables }));
  return JSON.parse(out).data;
}

let repoCache;
function repo() {
  const target = process.env.GH_REPO ? [process.env.GH_REPO] : [];
  repoCache ??= JSON.parse(gh(["repo", "view", ...target, "--json", "name,id"]));
  return repoCache;
}

function findProject(title) {
  const data = graphql(
    `query($org: String!) {
      organization(login: $org) {
        projectsV2(first: 100) { nodes { id number title } }
      }
    }`,
    { org: ORG },
  );
  return data.organization.projectsV2.nodes.find((p) => p.title === title);
}

function statusField(projectId) {
  const data = graphql(
    `query($id: ID!) {
      node(id: $id) {
        ... on ProjectV2 {
          field(name: "Status") {
            ... on ProjectV2SingleSelectField { id options { id name } }
          }
        }
      }
    }`,
    { id: projectId },
  );
  return data.node.field;
}

function ensure() {
  const { name, id } = repo();
  let project = findProject(name);

  if (!project) {
    const org = graphql(`query($org: String!) { organization(login: $org) { id } }`, { org: ORG });
    project = graphql(
      `mutation($owner: ID!, $title: String!) {
        createProjectV2(input: { ownerId: $owner, title: $title }) {
          projectV2 { id number title }
        }
      }`,
      { owner: org.organization.id, title: name },
    ).createProjectV2.projectV2;
    console.log(`opprettet board ${name}`);
  }

  // Deltakerne er ofte ikke medlemmer av organisasjonen, bare av repoet. Et
  // privat org-board ville vært usynlig for dem.
  graphql(
    `mutation($id: ID!) {
      updateProjectV2(input: { projectId: $id, public: true }) { projectV2 { id } }
    }`,
    { id: project.id },
  );

  const field = statusField(project.id);
  const names = field.options.map((o) => o.name);
  if (LANES.some((l) => !names.includes(l.name))) {
    graphql(
      `mutation($field: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
        updateProjectV2Field(input: { fieldId: $field, singleSelectOptions: $options }) {
          projectV2Field { ... on ProjectV2SingleSelectField { id } }
        }
      }`,
      { field: field.id, options: LANES },
    );
    console.log("satte kolonnene");
  }

  try {
    graphql(
      `mutation($project: ID!, $repo: ID!) {
        linkProjectV2ToRepository(input: { projectId: $project, repositoryId: $repo }) {
          repository { name }
        }
      }`,
      { project: project.id, repo: id },
    );
  } catch {
    // Allerede koblet.
  }

  boardView(project.id);
  return project;
}

// Et nytt prosjekt får én visning, og den er et regneark. For en deltaker som
// aldri har brukt GitHub ser det ut som nok en issue-liste, ikke som en tavle
// der arbeidet flytter seg. Gjør den om til kanban — en BOARD_LAYOUT-visning
// grupperer på Status av seg selv.
function boardView(projectId) {
  const views = graphql(
    `query($id: ID!) {
      node(id: $id) {
        ... on ProjectV2 { views(first: 5) { nodes { id name layout } } }
      }
    }`,
    { id: projectId },
  ).node.views.nodes;

  if (views.some((v) => v.layout === "BOARD_LAYOUT")) return;

  graphql(
    `mutation($view: ID!) {
      updateProjectV2View(input: { viewId: $view, name: "Tavle", layout: BOARD_LAYOUT }) {
        projectV2View { id }
      }
    }`,
    { view: views[0].id },
  );
  console.log("gjorde tavla om til kanban");
}

function issueItem(project, number) {
  const { name } = repo();
  const data = graphql(
    `query($org: String!, $repo: String!, $n: Int!) {
      repository(owner: $org, name: $repo) {
        issue(number: $n) {
          id
          projectItems(first: 20) { nodes { id project { id } } }
        }
      }
    }`,
    { org: ORG, repo: name, n: number },
  );
  const issue = data.repository.issue;
  const existing = issue.projectItems.nodes.find((i) => i.project.id === project.id);
  if (existing) return existing.id;

  return graphql(
    `mutation($project: ID!, $content: ID!) {
      addProjectV2ItemById(input: { projectId: $project, contentId: $content }) { item { id } }
    }`,
    { project: project.id, content: issue.id },
  ).addProjectV2ItemById.item.id;
}

function setLane(project, field, itemId, lane) {
  const option = field.options.find((o) => o.name === lane);

  graphql(
    `mutation($project: ID!, $item: ID!, $field: ID!, $option: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $project, itemId: $item, fieldId: $field,
        value: { singleSelectOptionId: $option }
      }) { projectV2Item { id } }
    }`,
    { project: project.id, item: itemId, field: field.id, option: option.id },
  );
}

// Leser tilstanden fra issues og pull requests, og retter boardet etter den.
// Trygt å kjøre så ofte man vil.
function laneFor(issue, openPrIssues) {
  if (issue.state === "CLOSED") return "Ferdig";
  if (openPrIssues.has(issue.number)) return "Review";
  if (issue.assignees.length > 0) return "Under arbeid";
  if (issue.labels.some((l) => l.name === "idé")) return "Idé";
  return "Klar";
}

function sync() {
  const project = ensure();
  const issues = JSON.parse(
    gh(["issue", "list", "--state", "all", "--limit", "200", "--json", "number,state,assignees,labels"]),
  );
  const prs = JSON.parse(gh(["pr", "list", "--state", "open", "--json", "body"]));
  const openPrIssues = new Set(
    prs.flatMap((pr) => [...(pr.body ?? "").matchAll(/(?:closes|fixes|resolves)\s+#(\d+)/gi)].map((m) => Number(m[1]))),
  );

  const field = statusField(project.id);
  for (const issue of issues) {
    setLane(project, field, issueItem(project, issue.number), laneFor(issue, openPrIssues));
  }
  console.log(`boardet er oppdatert (${issues.length} oppgaver)`);
}

const [cmd] = process.argv.slice(2);
try {
  if (cmd === "ensure") ensure();
  else if (cmd === "sync") sync();
  else {
    console.error("Bruk: board.mjs ensure | sync");
    process.exit(2);
  }
} catch (err) {
  const msg = String(err.stderr || err.message || err);
  if (/scope|read:project|INSUFFICIENT_SCOPES/i.test(msg)) {
    console.error("MANGLER_PROJECT_TILGANG: logg inn på nytt med project-tilgang, se skadefryd-login.");
  } else {
    console.error(msg.trim());
  }
  process.exit(1);
}
