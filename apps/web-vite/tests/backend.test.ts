import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "@packages/backend/convex/_generated/api";
import schema from "@packages/backend/convex/schema";

test("sending messages", async () => {
  const t = convexTest(schema);
  await t.mutation(api.everwhz.addPodcast, { rss_url: "https://rss.com", name: "test" });
  await t.mutation(api.everwhz.episode, { podcast_id: "test", title: "test", description: "test", url: "https://url.com" });
  const messages = await t.query(api.messages.list);
  expect(messages).toMatchObject([
    { body: "Hi!", author: "Sarah" },
    { body: "Hey!", author: "Tom" }
  ]);
});