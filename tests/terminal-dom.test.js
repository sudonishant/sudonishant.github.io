const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const terminalDom = require("../terminal-dom.js");

class FakeNode {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.className = "";
    this._textContent = "";
    this._innerHTML = undefined;
  }

  set textContent(value) {
    this._textContent = String(value);
  }

  get textContent() {
    return this._textContent;
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }
}

const fakeDocument = {
  createElement: (tagName) => new FakeNode(tagName),
  createTextNode: (text) => {
    const node = new FakeNode("#text");
    node.textContent = text;
    return node;
  }
};

test("command echo renders user input as text, not HTML", () => {
  const payload = '<img src=x onerror="globalThis.pwned=true">';
  const promptMarkup = '<span class="prompt-user">nee$</span>';
  const row = terminalDom.createCommandEcho(payload, promptMarkup, fakeDocument);
  const commandNode = row.children.at(-1);

  assert.equal(row.className, "terminal-command-echo");
  assert.equal(row.children[0]._innerHTML, promptMarkup);
  assert.equal(commandNode.className, "term-input-echo");
  assert.equal(commandNode.textContent, payload);
  assert.equal(commandNode._innerHTML, undefined);
});

test("HTML-escaped prompt values and text survive redirection decoding", () => {
  const value = '<img title="x"> & test';
  const escaped = terminalDom.escapeHtml(value);
  assert.equal(escaped, "&lt;img title=&quot;x&quot;&gt; &amp; test");
  assert.equal(terminalDom.decodeHtmlEntities(escaped), value);
});

test("all terminal-input echo paths use the safe DOM helper", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.ok(html.indexOf('src="terminal-dom.js"') < html.indexOf('src="script.js"'));
  assert.equal((source.match(/terminalDom\.createCommandEcho\(inputVal/g) || []).length, 2);
  assert.equal((source.match(/terminalDom\.createCommandEcho\(currentVal/g) || []).length, 2);
  assert.match(source, /terminalDom\.createCommandEcho\(`\$\{terminalInput\.value\}\^C`/);

  const unsafeEchoLines = source.split("\n").filter((line) =>
    /\.innerHTML\s*=/.test(line) && /\$\{(?:inputVal|currentVal|terminalInput\.value)/.test(line)
  );
  assert.deepEqual(unsafeEchoLines, []);
  assert.match(source, /action: \(args\) => terminalDom\.escapeHtml\(args \|\| ""\)/);
  assert.match(source, /terminalDom\.escapeHtml\(fileContent\)\.replace\(\/\\n\/g, "<br>"\)/);
});
