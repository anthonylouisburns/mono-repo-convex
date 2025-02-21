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

// get every episode without years
// put gemini requests in a table
// than run gemini requests - and save response in table

// add to episode scheme, years, podcast_title, episode_title, episode_description, geonames, location, time_period
// start job to about years from gemini response
// fill in all new columns
// fill in time spans - api.everwhz.timeline

//TODO loop by podcasts
//TODO while loop
//process prompts
//TODO reorganize code use async functions, call a single mutation per transaction
//TODO set type of podcast
//


export const geminiHistoryByPodcast = internalAction({
  args: {
    podcast_id: v.id("podcast"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const episodes = await ctx.runQuery(internal.gemini.getListOfEpisodes, {
      podcast_id: args.podcast_id,
      limit: args.limit,
    });
    const items = episodes.map((episode) => ({
      id: episode._id,
      title: episode.title ?? "Untitled",
      description: episode.body?.description ?? "",
    }));
    const prompt = await geminiHistory(items);
    const response = await geminiHistoryResponse(prompt);
    await ctx.runMutation(internal.gemini.savePrompt, {
      podcast_id: args.podcast_id,
      prompt: prompt,
      response: response,
    });
    // mark episodes as prompt created
    await ctx.runMutation(internal.gemini.markPromptCreated, {
      items: items.map((item) => ({
        id: item.id,
      })),
    });
    return response;
  },
});

export const processPromptResponse = internalMutation({
  args: {
    prompt_id: v.id("gemini_prompt"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.prompt_id);

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

export const markPromptCreated = internalMutation({
  args: {
    items: v.array(
      v.object({
        id: v.id("episode"),
      }),
    ),
  },
  handler: async (ctx, args) => {
    args.items.map((item) => {
      ctx.db.patch(item.id, {
        status: "prompt_created",
      });
    });
  },
});

export const savePrompt = internalMutation({
  args: {
    podcast_id: v.id("podcast"),
    prompt: v.string(),
    response: v.string(),
    chart: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("gemini_prompt", {
      podcast_id: args.podcast_id,
      prompt: args.prompt,
      response: args.response,
      chart: args.chart,
    });
  },
});

export const getListOfEpisodes = internalQuery({
  args: {
    podcast_id: v.id("podcast"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const episodes = await ctx.db
      .query("episode")
      .withIndex("podcast_episode_number", (q) =>
        q.eq("podcast_id", args.podcast_id),
      )
      .filter((q) => q.eq(q.field("status"), undefined))
      .take(args.limit);

    return episodes;
  },
});

//TODO prompt by podcast type
export async function geminiHistory(
  items: Array<{
    id: Id<"episode">;
    title: string;
    description: string;
  }>,
): Promise<any> {
  const prompt =
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

    ` + JSON.stringify(items);

  return prompt;
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
