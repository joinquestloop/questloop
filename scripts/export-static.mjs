import { cp, mkdir, rm, writeFile } from "node:fs/promises";

const output = new URL("../dist/pages/", import.meta.url);
const client = new URL("../dist/client/", import.meta.url);
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("export", Date.now().toString());

const { default: worker } = await import(workerUrl.href);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(client, output, { recursive: true });

for (const route of ["/", "/signup", "/onboarding", "/quests", "/quest", "/community", "/profile", "/settings"]) {
  const response = await worker.fetch(
    new Request(`https://questloop.app${route}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const html = await response.text();

  if (!response.ok) {
    throw new Error(
      `Static export of ${route} failed with status ${response.status}: ${html.slice(0, 2000)}`,
    );
  }

  const directory = route === "/" ? output : new URL(`.${route}/`, output);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("index.html", directory), html);
}

console.log("Static Cloudflare Pages export written to dist/pages");
