(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.TerminalDom = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function decodeHtmlEntities(value) {
    return String(value)
      .replace(/&nbsp;/g, "\u00a0")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, ">")
      .replace(/&lt;/g, "<")
      .replace(/&amp;/g, "&");
  }

  function createCommandEcho(commandText, promptMarkup, doc) {
    const documentRef = doc || document;
    const row = documentRef.createElement("div");
    row.className = "terminal-command-echo";

    if (promptMarkup) {
      const prompt = documentRef.createElement("span");
      prompt.innerHTML = promptMarkup;
      row.appendChild(prompt);
      row.appendChild(documentRef.createTextNode(" "));
    }

    const command = documentRef.createElement("span");
    command.className = "term-input-echo";
    command.textContent = String(commandText);
    row.appendChild(command);
    return row;
  }

  return { escapeHtml, decodeHtmlEntities, createCommandEcho };
});
