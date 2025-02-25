import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  internalMutation,
  MutationCtx,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";


// todo make sure deleted episodes are added to the podcast
export const getGeminiCreatePromptAndProcess = internalAction({
  handler: async (ctx) => {

    const podcast = await ctx.runQuery(internal.geminiBatch.getNextPodcast);
    if (!podcast || !podcast.chart) {
      console.log("No podcast found");
      return;
    }
    const prompt_id = await ctx.runMutation(internal.geminiBatch.geminiCreatePrompt, {
      podcast_id: podcast._id,
      chart: podcast.chart,
    });
    if (!prompt_id) {
      console.log("No prompt_id found");
      return;
    }
    await ctx.runAction(internal.geminiBatch.getGeminiResponse, {
      prompt_id: prompt_id,
    });

    await ctx.scheduler.runAfter(0, internal.geminiBatch.processPromptResponse, {
      prompt_id: prompt_id,
    });

    // run again after 10 seconds
  }
});

export const getNextPodcast = internalQuery({
  args: {},
  handler: async (ctx) => {
    const podcast = await ctx.db.query("podcast")
      .filter((q) => q.neq(q.field("chart"), undefined))
      .first();
      
    return podcast;
  }
});

export const geminiCreatePrompt = internalMutation({
  args: {podcast_id: v.id("podcast"), chart: v.string()},
  handler: async (ctx, args) => {
    const prompt_id = await geminiHistoryOnePodcast(args.podcast_id, args.chart, 25, ctx);
    if (!prompt_id) {
      console.log("No prompt_id found");
      return;
    }
    return prompt_id;
  }
});

export const getGeminiResponse = internalAction({
  args: {
    prompt_id: v.id("gemini_prompt"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.runQuery(internal.geminiBatch.getGeminiPrompt, { 
      prompt_id: args.prompt_id,
    });
    if (!prompt) {
      console.log("No prompt found");
      return;
    }
    const response = await geminiHistoryResponse(prompt.prompt);
    await ctx.runMutation(internal.geminiBatch.saveGeminiResponse, {
      prompt_id: args.prompt_id,
      response: response,
    });
  }
});

export const getGeminiPrompt = internalQuery({
  args: {
    prompt_id: v.id("gemini_prompt"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.prompt_id);
    return prompt;
  }
});

export const saveGeminiResponse = internalMutation({
  args: {
    prompt_id: v.id("gemini_prompt"),
    response: v.string(),
  },
  handler: async (ctx, args) => { 
    await ctx.db.patch(args.prompt_id, {
      response: args.response,
    });
  }
});

export async function geminiHistoryOnePodcast(podcast_id: Id<"podcast">, chart: string, limit: number, ctx: MutationCtx) {
  console.log("geminiHistoryOnePodcast", podcast_id, chart, limit);
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
  const prompt_string = await geminiPrompt(items, chart);
  // const response = await geminiHistoryResponse(prompt);
  const prompt_id = await savePrompt(podcast_id, prompt_string, chart, ctx);
  console.log("prompt_id", prompt_id);
  return prompt_id;
}

export async function savePrompt (podcast_id: Id<"podcast">, prompt: string, chart: string, ctx: MutationCtx) {
  return await ctx.db.insert("gemini_prompt", {
    podcast_id: podcast_id,
    prompt: prompt,
    chart: chart,
  });
}

export const HISTORY_PROMPT =
  `
    I need years and time period and location based on the topics mentioned in the list of items below : 
    please respond with:
    [
        {
            id: string,
            years: string[],  // at least 1 year format YYYY or YYYY.MM.DD
            geonames: string[],  // at least 1 geoname
        }
    ]
`;

export const MUSIC_PROMPT =
  `
    I need years and time period based on the songs and events mentioned and location based on the artists and events mentioned in the list of items below every event must have at least one year: 
    please respond with:
    [
        {
            id: string,
            years: string[],  // at least 1 year format YYYY or YYYY.MM.DD
            geonames: string[],  // at least 1 geoname
        }
    ]

`;


export const FILM_PROMPT =
  `
    I am submitting a list of episodes from a musical history podcast, each item has an id, title and description. I need the years discussed in the podcast especially the years the songs were released. I need atleast one year per item.
    please respond with:
    [
        {
            id: string,
            years: string[],  // at least 1 year format YYYY or YYYY.MM.DD
            geonames: string[],  // at least 1 geoname
        }
    ]

`;

// TODO: create prompt with title of podcast and description of podcast and the full list of episode titles

export async function geminiPrompt(
  items: Array<{
    id: Id<"episode">;
    title: string;
    description: string;
  }>,
  chart: string
): Promise<string> {
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
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });
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
    if (!prompt?.response) {
      return;
    }

    const responseJson = prompt.response.replace("```json", "").replace("```", "");
    const json = JSON.parse(responseJson);
    
    const items: Array<{ id: Id<"episode">; years: string[]; }> = json.map((item: any) => {
      const id = item.id;
      // Handle different content types based on the response structure
      const years = item.years.sort();
      
      return { id, years };
    });
    // insert years into episode
    items.map((item) => {
      if(item.years.length > 0) {
        ctx.db.patch(item.id, {
          years: item.years,
          status: "years_inserted",
        });
      }else{
        ctx.db.patch(item.id, {
          status: "failed to insert years",
        });
        console.log("failed to insert years", item.id);
      }
    });
    console.log(items);
  },
});