import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    timeSpans: v.optional(v.array(v.object({
      name: v.string(),
      start: v.string(),
      end: v.string(),
    }))),
  })
  .index("rss_url", ["rss_url"]),
  episode: defineTable({
    podcast_id: v.id("podcast"),
    episode_number: v.number(),
    // title: v.string(),
    // pud_date: v.string(),
    // media_url: v.string(),
    body: v.any(),
    timeSpans: v.optional(v.array(v.object({
      name: v.string(),
      start: v.string(),
      end: v.string(),
    }))),
  })
  .index("podcast_episode_number", ["podcast_id", "episode_number"]),
});
