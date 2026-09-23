document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bjarne-form");
  const question = document.getElementById("bjarne-question");
  const submit = document.getElementById("bjarne-submit");
  const status = document.getElementById("bjarne-status");
  const errorBox = document.getElementById("bjarne-error");
  const retry = document.getElementById("bjarne-retry");
  const result = document.getElementById("bjarne-result");
  const answer = document.getElementById("bjarne-answer");
  const sourcesList = document.getElementById("bjarne-sources");
  const sourcesHeading = document.getElementById("bjarne-sources-heading");
  if (!form || !question || !submit || !status || !errorBox || !retry || !result || !answer || !sourcesList || !sourcesHeading) {
    throw new Error("The Bjarne page is missing a required element.");
  }

  let connectedSite;
  const showError = (message) => {
    errorBox.textContent = message;
    errorBox.hidden = false;
  };
  const clearError = () => {
    errorBox.textContent = "";
    errorBox.hidden = true;
    retry.hidden = true;
  };

  async function request(path, body) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("The local API returned an unreadable response.");
    }
    if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : `The local API returned ${response.status}.`);
    return data;
  }

  function checkedSource(source) {
    if (!source || typeof source.title !== "string" || typeof source.url !== "string" || !["jira", "confluence"].includes(source.kind)) {
      throw new Error("Atlassian returned a source without a valid title or link.");
    }
    let url;
    try {
      url = new URL(source.url);
    } catch {
      throw new Error("Atlassian returned an invalid source link.");
    }
    if (!connectedSite || url.origin !== connectedSite.origin || !/^\/(?:browse\/[A-Za-z][A-Za-z0-9_]*-\d+|wiki\/(?:spaces\/[^/]+\/pages\/\d+|x\/[A-Za-z0-9_-]+))$/.test(url.pathname)) {
      throw new Error("Atlassian returned a source outside the authorized site.");
    }
    return { ...source, url: url.href };
  }

  function renderAnswer(data) {
    if (!data || typeof data.answer !== "string" || !Array.isArray(data.sources) || !["sources", "unknown"].includes(data.state)) {
      throw new Error("The local API returned an invalid answer.");
    }
    const sources = data.sources.map(checkedSource);
    const parts = data.answer.split(/(\[\d+\])/g).map((part) => {
      const citation = /^\[(\d+)\]$/.exec(part);
      if (!citation) return document.createTextNode(part);
      const source = sources[Number(citation[1]) - 1];
      if (!source) throw new Error("The answer contains an unavailable source citation.");
      const link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = part;
      link.setAttribute("aria-label", `Source ${citation[1]}: ${source.title}`);
      return link;
    });
    const items = sources.map((source, index) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `[${index + 1}] ${source.title}`;
      const kind = document.createElement("small");
      kind.textContent = source.kind === "jira" ? "Jira · open to verify the full context" : "Confluence · open to verify the full context";
      item.append(link, kind);
      return item;
    });
    answer.replaceChildren(...parts);
    sourcesList.replaceChildren(...items);
    sourcesHeading.hidden = sources.length === 0;
    result.hidden = false;
  }

  async function connect() {
    clearError();
    submit.disabled = true;
    connectedSite = undefined;
    if (location.protocol === "file:") {
      status.textContent = "Bjarne needs the local server. Ask your assistant to start it and open this tab through the app.";
      return;
    }
    status.textContent = "Connecting to Atlassian. Approve the browser prompt if it appears.";
    try {
      const connection = await request("/api/atlassian/connect", {});
      if (connection.state !== "connected" || typeof connection.site !== "string") throw new Error("Atlassian did not confirm the connection.");
      connectedSite = new URL(connection.site);
      if (connectedSite.protocol !== "https:" || !connectedSite.hostname.endsWith(".atlassian.net")) {
        throw new Error("Atlassian returned an invalid site.");
      }
      status.textContent = `Connected to ${connectedSite.hostname} with your permissions.`;
      submit.disabled = false;
    } catch (error) {
      status.textContent = "Atlassian is not connected.";
      showError(error instanceof Error ? error.message : "Atlassian connection failed.");
      retry.hidden = false;
    }
  }

  retry.addEventListener("click", () => { void connect(); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const value = question.value.trim();
    if (!value || value.length > 500) {
      showError("Enter a question of 1–500 characters.");
      return;
    }
    clearError();
    result.hidden = true;
    submit.disabled = true;
    status.textContent = "Bjarne is comparing live Jira and Confluence excerpts…";
    try {
      renderAnswer(await request("/api/ask", { question: value }));
      status.textContent = "Bjarne checked the available sources.";
    } catch (error) {
      status.textContent = "Bjarne could not complete the search.";
      showError(error instanceof Error ? error.message : "The search failed.");
      retry.hidden = false;
    } finally {
      submit.disabled = !connectedSite;
    }
  });

  void connect();
});
