import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  pending_podcast: defineTable({
    rss_url: v.string(),
    user_id: v.union(v.id("users"), v.literal("INTERNAL")),
  }).index("rss_user", ["user_id", "rss_url"]),
  podcast: defineTable({
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    rss_url: v.string(),
    rss_body: v.optional(v.id("_storage")),
    number_of_episodes: v.optional(v.number()),
    chart: v.optional(v.string()),
    rank: v.optional(v.number()),
    updated_date: v.optional(v.string()),
    response_headers: v.optional(
      v.object({
        last_modified: v.optional(v.string()),
        etag: v.optional(v.string()),
      }),
    ),
  }).index("rss_url", ["rss_url"]).index("rank", ["rank"]),
  // years, geonames, location, time_period
  timeline: defineTable({
    podcast_id: v.id("podcast"),
    episode_id: v.id("episode"),
    episode_number: v.number(),
    start: v.string(),
    end:v.string(),
    geoname: v.string(),
    chart: v.string(),
    rank: v.number(),
  })
  .index("podcast_episode", ["podcast_id", "episode_id"])
  .index("start_index", ["start", "chart", "rank","episode_number"]),   
  episode: defineTable({
    podcast_id: v.id("podcast"),
    episode_number: v.number(),
    podcast_title: v.optional(v.string()),
    title: v.optional(v.string()),
    episode_description: v.optional(v.string()),
    years: v.optional(v.array(v.string())),
    geonames: v.optional(v.array(v.string())),
    location: v.optional(v.array(v.string())),
    time_period: v.optional(v.array(v.string())),
    mp3_link: v.optional(v.string()),
    status: v.optional(v.string()),
    chart: v.optional(v.string()),
    rank: v.optional(v.number()),
    updated_date: v.optional(v.string()),
  })
    .index("podcast_episode_number", ["podcast_id", "episode_number"])
    .index("years", ["years", "rank", "episode_number"]),
  timespan: defineTable({
    podcast_id: v.id("podcast"),
    episode_id: v.optional(v.id("episode")),
    name: v.optional(v.string()),
    start: v.string(),
    end: v.string(),
  })
    .index("podcast_episode", ["podcast_id", "episode_id"])
    .index("start", ["start"])
    .index("end", ["end"]),
  user: defineTable({
    tokenIdentifier: v.string(),
    issuer: v.string(),
    email: v.string(),
    name: v.string(),
  }).index("tokenIdentifier", ["tokenIdentifier", "issuer"]),
  play_status: defineTable({
    user_id: v.optional(v.id("users")),
    device_id: v.optional(v.string()),
    episode_id: v.id("episode"),
    position: v.number(),
  })
    .index("user", ["user_id", "episode_id"])
    .index("device", ["device_id", "episode_id"]),
  podcast_suggestions: defineTable({
    suggestions: v.array(v.string()),
  }),
  taddy_charts: defineTable({
    date: v.string(),
    chart_type: v.string(),
    page: v.number(),
    chart_data: v.any(),
  }).index("chart_index", ["date", "chart_type", "page"]),
  gemini_prompt: defineTable({
    podcast_id: v.id("podcast"),
    prompt: v.string(),
    response: v.optional(v.string()),
    chart: v.string(),
    status: v.optional(v.string()),
    batch: v.string(),
  }).index("podcast_id", ["podcast_id"])
  .index("batch", ["batch", "status"]),
  test_table: defineTable({
    name: v.string(),
    age: v.number(),
    city: v.string(),
  }).index("i_1", ["city", "age", "name"]),
});
export default schema;
