import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalAction,
  internalQuery,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const geminiProcessPodcast = internalMutation({
  args: {},
  handler: async (ctx) => {
    const podcast = await ctx.db.query("podcast")
      .withIndex("rank", (q) => q.eq("rank", 1))
      .filter((q) => q.neq(q.field("chart"), undefined))
      .first();

    if (!podcast || !podcast.chart) {
      console.log("No podcast found");
      return;
    }

    const prompt_id = await geminiHistoryOnePodcast(podcast._id, podcast.chart, 25, ctx);
    await ctx.scheduler.runAfter(0, internal.geminiBatch.processPromptResponse, {
      prompt_id: prompt_id,
    });
    return podcast._id;
  }
});

export async function geminiHistoryOnePodcast(podcast_id: Id<"podcast">, chart: string, limit: number, ctx: MutationCtx) {
  const episodes = await ctx.db
    .query("episode")
    .withIndex("podcast_episode_number", (q) =>
      q.eq("podcast_id", podcast_id),
    )
    .filter((q) => q.eq(q.field("status"), undefined))
    .filter((q) => q.eq(q.field("years"), undefined))
    .take(limit);

  if (episodes.length === 0) {
    console.log("No episodes found");
    return;
  }

  const items = episodes.map((episode) => ({
    id: episode._id,
    title: episode.title ?? "Untitled",
    description: episode.body?.description ?? "",
  }));
  const prompt = await geminiPrompt(items, chart);
  const response = await geminiHistoryResponse(prompt);
  await savePrompt(podcast_id, prompt, response, chart, ctx);

  return prompt._id;
}

export async function savePrompt (podcast_id: Id<"podcast">, prompt: string, response: string, chart: string, ctx: MutationCtx) {
  await ctx.db.insert("gemini_prompt", {
    podcast_id: podcast_id,
    prompt: prompt,
    response: response,
    chart: chart,
  });
}

export const HISTORY_PROMPT =
  `
    I need years and time period and location based on the topics mentioned in the list of items below: 
    please respond with:
    [
        {
            id: string,
            events: [{
                title: string,
                years: string[],  // at least 1 year format YYYY or YYYY.MM.DD
                geonames: string[],  // at least 1 geoname
                location: string,
                time_period: string
            }]
        }
    ]
`;

export const MUSIC_PROMPT =
  `
    I need years and time period based on the songs mentioned and location based on the artists mentioned in the list of items below: 
    please respond with:
    [
        {
            id: string,
            songs: [{
                title: string,
                years: string[],  // at least 1 year format YYYY or YYYY.MM.DD
                geonames: string[],  // at least 1 geoname
                location: string,
                time_period: string
            }]
        }
    ]

`;


export const FILM_PROMPT =
  `
    I need the setting information for the movies discussed in the podcast episodes described here in the list of items below: 
    please respond with:
    [
        {
            id: string,
            movies: [{
                title: string,
                years: string[],  // at least 1 year format YYYY or YYYY.MM.DD
                geonames: string[],  // at least 1 geoname
                location: string,
                time_period: string
            }]
        }
    ]

`;





export async function geminiPrompt(
  items: Array<{
    id: Id<"episode">;
    title: string;
    description: string;
  }>,
  chart: string
): Promise<any> {
  switch (chart) {
    case "PODCASTSERIES_HISTORY":
      return HISTORY_PROMPT + JSON.stringify(items);
    case "PODCASTSERIES_MUSIC_HISTORY":
      return MUSIC_PROMPT + JSON.stringify(items);
    case "PODCASTSERIES_TV_AND_FILM_HISTORY":
      return FILM_PROMPT + JSON.stringify(items);
    default:
      return "";
  }
}

export async function geminiHistoryResponse(prompt: string) {
  const genAI = new GoogleGenerativeAI(
    "AIzaSyDJA8p-kNXjviC_4jyuZljDhaGbjcoxxXU",
  );
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
  return result.response.text();
}


export const processPromptResponse = internalMutation({
  args: {
    prompt_id: v.id("gemini_prompt"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.prompt_id);
    const chart = prompt?.chart;

    const response = prompt?.response;
    if (!response) {
      return;
    }
    // const responseJson = JSON.parse(response);
    // response is a json array inside ```json```
    const responseJson = response.replace("```json", "").replace("```", "");
    const json = JSON.parse(responseJson);
    // for each item get id and than from the events get a list of all the unique years in the events in order as an array
    const items: Array<{
      id: Id<"episode">;
      years: string[];
    }> = json.map((item: any) => {
      const id = item.id;
      const years = [
        ...new Set(item.events.map((event: any) => event.years).flat()),
      ].sort();
      return {
        id: id,
        years: years,
      };
    });
    // insert years into episode
    items.map((item) => {
      ctx.db.patch(item.id, {
        years: item.years,
        status: "years_inserted",
      });
    });
    console.log(items);
  },
});