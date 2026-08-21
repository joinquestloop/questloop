import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the QuestLoop landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /QuestLoop/);
  assert.match(html, /Start something/);
  assert.match(html, /100 Days of Code/);
  assert.match(html, /Build Your First SaaS/);
  assert.match(html, /30 Days of DSA/);
  assert.match(html, /Join early access/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("server-renders the account screens", async () => {
  const signupResponse = await render("/signup");
  assert.equal(signupResponse.status, 200);
  const signupHtml = await signupResponse.text();
  assert.match(signupHtml, /Create your account/);
  assert.match(signupHtml, /Sign in/);

  const onboardingResponse = await render("/onboarding");
  assert.equal(onboardingResponse.status, 200);
  const onboardingHtml = await onboardingResponse.text();
  assert.match(onboardingHtml, /Opening your QuestLoop profile/);
});

test("server-renders the quest picker", async () => {
  const response = await render("/quests");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /What will you/);
  assert.match(html, /Loading the first quests/);
});

test("server-renders the quest dashboard", async () => {
  const response = await render("/quest");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Opening your quest/);
});

test("server-renders the community feed", async () => {
  const response = await render("/community");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Community/);
  assert.match(html, /Loading community progress/);
});
