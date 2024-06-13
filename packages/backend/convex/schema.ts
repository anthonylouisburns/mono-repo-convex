import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { schemaToMermaid } from "convex-schema-mermaid";

const schema = defineSchema({
  notes: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    summary: v.optional(v.string()),
  }),
  podcast: defineTable({
    name: v.string(),
    rss_url: v.string(),
    rss_body: v.optional(v.id("_storage")),
    number_of_episodes: v.optional(v.number()),
  })
    .index("rss_url", ["rss_url"]),
  episode: defineTable({
    podcast_id: v.id("podcast"),
    episode_number: v.number(),
    // title: v.string(),
    // pud_date: v.string(),
    // media_url: v.string(),
    body: v.any(),
  })
    .index("podcast_episode_number", ["podcast_id", "episode_number"]),
  timespan: defineTable({
    podcast_id: v.id("podcast"),
    episode_id: v.optional(v.id("episode")),
    name: v.optional(v.string()),
    start: v.string(),
    end: v.string(),
  })
    .index("podcast_episode", ["podcast_id", "episode_id"]),
  user: defineTable({
    tokenIdentifier: v.string(),
    issuer: v.string(),
    email: v.string(),
    name: v.string(),
  })
  .index("tokenIdentifier", ["tokenIdentifier","issuer"])
});
console.log(schemaToMermaid(schema));
export default schema;
