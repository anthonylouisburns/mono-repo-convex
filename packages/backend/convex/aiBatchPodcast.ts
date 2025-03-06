import { api, internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";
import {
  internalMutation,
  MutationCtx,
  internalAction,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PODCASTSERIES_HISTORY, PODCASTSERIES_MUSIC_HISTORY, PODCASTSERIES_TV_AND_FILM_HISTORY } from "./taddy";
import OpenAI from "openai";
import { patchTimeline } from "./migration";


export const createAiPromptMutation = internalMutation({
  args: {
    podcast_id: v.id("podcast"),
    episode_ids: v.array(v.id("episode")),
    batch: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt_id = await createAiPrompt(ctx, args.podcast_id, args.episode_ids, args.batch);
    return prompt_id;
  }
});

export async function createAiPrompt(ctx: MutationCtx,
  podcast_id: Id<"podcast">,
  episode_ids: Array<Id<"episode">>,
  batch: string) {
  const podcast = await ctx.db.get(podcast_id);
  const chart = podcast?.chart;
  console.log("geminiHistoryOnePodcast", podcast_id, chart);

  if (!podcast || !chart) {
    console.log("No podcast or chart found");
    return;
  }
  const items = await Promise.all(episode_ids.map(async (episode_id) => {
    const episode = await ctx.db.get(episode_id);
    if (!episode) {
      console.log("No episode found");
      return null;
    }
    return {
      id: episode._id,
      title: stripHtml(episode.title ?? "Untitled"),
      description: stripHtml(episode.episode_description ?? ""),
    };
  })).then(results => results.filter((item): item is NonNullable<typeof item> => item !== null));

  console.log("items", items.length);

  const prompt_string = await geminiPrompt(podcast, items, chart);
  return await savePrompt(podcast_id, prompt_string, chart, batch, ctx);
}

export const postOnePrompt = internalAction({
  args: { prompt_id: v.id("gemini_prompt"), batch: v.string() },
  handler: async (ctx, args) => {
    const prompt = await ctx.runQuery(internal.aiBatchPodcast.getPrompt, { prompt_id: args.prompt_id });
    console.log("postOnePrompt", args.batch, prompt?._id);
    if (!prompt) {
      console.log("No prompt found");
      return false;
    }
    await ctx.runMutation(internal.aiBatchPodcast.patchPromptStatus, {
      prompt_id: prompt._id,
      status: "response_generating",
    });
    const response = await aiHistoryResponse(prompt.prompt);
    if (!response) {
      console.log("No response found");
      return false;
    }
    await ctx.runMutation(internal.aiBatchPodcast.saveGeminiResponse, {
      prompt_id: prompt._id,
      response: response,
      status: "response_generated",
    });
    return true;
  }
});

export const getPrompt = internalQuery({
  args: {
    prompt_id: v.id("gemini_prompt"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.prompt_id);
    return prompt;
  }
});

export async function aiHistoryResponse(prompt: string) {
  // console.log("geminiHistoryResponse", prompt);
  return await openaiResponse(prompt);
}

export const saveGeminiResponse = internalMutation({
  args: {
    prompt_id: v.id("gemini_prompt"),
    response: v.string(),
    status: v.string(),
  },

  handler: async (ctx, args) => {
    await ctx.db.patch(args.prompt_id, {
      response: args.response,
      status: args.status,
    });
  }
});

export const patchPromptStatus = internalMutation({
  args: {
    prompt_id: v.id("gemini_prompt"),
    status: v.string(),
  },

  handler: async (ctx, args) => {
    await ctx.db.patch(args.prompt_id, {
      status: args.status,
    });
  }
});

//[ ] move to utils
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export async function savePrompt(podcast_id: Id<"podcast">, prompt: string, chart: string, batch: string, ctx: MutationCtx) {
  console.log("savePrompt", podcast_id, chart);
  return await ctx.db.insert("gemini_prompt", {
    podcast_id: podcast_id,
    prompt: prompt,
    chart: chart,
    batch: batch,
  });
}

export const HISTORY_PROMPT =
  `
    Below is a description of a history podcast and a list of episodes with title and description.
    every episode must have at least 1 specific year and 1 geoname.
    For each episode, please respond with:
    {id: string,years: string[], geonames: string[]},
    return an array [{id: string,years: string[], geonames: string[]}...]
`;

export const MUSIC_PROMPT =
  `
    Below is a description of a music history podcast and a list of episodes with title and description.
    every episode must have at least 1 specific year and 1 geoname.
    For each episode, please respond with:
    {id: string,years: string[], geonames: string[]},
    return an array [{id: string,years: string[], geonames: string[]}...]
`;


export const FILM_PROMPT =
  `
    Below is a description of a tv and film history podcast and a list of episodes with title and description.
    every episode must have at least 1 specific year and 1 geoname.
    For each episode, please respond with:
    {id: string,years: string[], geonames: string[]},
    return an array [{id: string,years: string[], geonames: string[]}...]
`;

export async function geminiPrompt(
  podcast: Doc<"podcast">,
  items: Array<any>,
  chart: string
): Promise<string> {
  console.log("geminiPrompt", podcast.title, podcast.description, items, chart);
  const data = {
    podcast_title: stripHtml(podcast.title ?? ""),
    podcast_description: stripHtml(podcast.description ?? ""),
    episodes: items,
  }
  if (!podcast.chart) {
    console.log("No chart found for podcast", podcast.title, podcast._id, "chart", chart);
    return "";
  }
  switch (podcast.chart) {
    case PODCASTSERIES_HISTORY:
      return HISTORY_PROMPT + JSON.stringify(data);
    case PODCASTSERIES_MUSIC_HISTORY:
      return MUSIC_PROMPT + JSON.stringify(data);
    case PODCASTSERIES_TV_AND_FILM_HISTORY:
      return FILM_PROMPT + JSON.stringify(data);
    default:
      return "";
  }
}

export async function geminiResponse(prompt: string) {
  const genAI = new GoogleGenerativeAI(
    "AIzaSyDJA8p-kNXjviC_4jyuZljDhaGbjcoxxXU",
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });
  const result = await model.generateContent(prompt);
  console.log("response", "...", result.response.text().substring(result.response.text().length - 200));
  return result.response.text();
}

export async function openaiResponse(prompt: string) {
  console.log("openai")
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const output = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }] });
  console.log(output);
  return output.choices[0].message.content;
}

export const processPromptResponse = internalMutation({
  args: {
    prompt_id: v.id("gemini_prompt"),
  },
  handler: async (ctx, args) => {
    console.log("processPromptResponse", args.prompt_id);
    const prompt = await ctx.db.get(args.prompt_id);
    if (!prompt?.response) {
      return;
    }

    let items: Array<{ id: Id<"episode">; years: string[]; geonames: string[]; }> = [];
    try {
      items = await getJsonFromResponse(prompt.response);
    } catch (error) {
      console.log("error", error);

      await ctx.db.patch(args.prompt_id, {
        status: "response_processed_error",
      });//[ ] todo move to where called not in function
      return false;
    }
    if (!items) {
      await ctx.db.patch(args.prompt_id, {
        status: "response_processed_error",
      });
      return false;
    }
    // insert years into episode
    for (const item of items) {
      try {
        if (item.years.length > 0) {
          console.log("patch years", item.id, item.years, item.geonames);
          const episode_id = item.id;
          await ctx.db.patch(item.id, {
            years: item.years,
            geonames: item.geonames,
            status: "years_inserted",
          });
          await patchTimeline(ctx, episode_id);
        } else {
          console.log("failed to insert years episode:", item.id, "prompt:", prompt._id);
          await ctx.db.patch(item.id, {
            status: "failed to insert years"
          });
        }
      } catch (error) {
        console.error("error failed to insert", error);
        await ctx.db.patch(args.prompt_id, {
          status: "response_processed_error",
        });
      }
    }
    console.log("processPromptResponse done");
    await ctx.db.patch(args.prompt_id, {
      status: "response_processed",
    });
  },
});

export async function getJsonFromResponse(response: string) {
  // just get the string between ```json and ```
  console.log("getJsonFromResponse", response);
  let responseJson = response.substring(response.indexOf("["), response.lastIndexOf("]") + 1);
  responseJson = responseJson
    .replace(/\/.*/g, '') // Remove single-line comments;;
    // Add quotes to unquoted keys
    .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  // responseJson = responseJson.replace(/\n/g, '')

  console.log("responseJson", responseJson);
  if (responseJson.indexOf("[") != 0) {
    console.log("json wrong format", response);
  }

  const json = JSON.parse(responseJson);
  console.log("json", json);
  const items: Array<{ id: Id<"episode">; years: string[]; geonames: string[]; }> = json.map((item: any) => {
    try {
      const id = item.id;
      const years = item.years.sort();
      const geonames = item.geonames.sort();
      return { id, years, geonames };
    } catch (error) {
      console.log("error", error, item);
      return null;
    }
  });
  console.log("items", items);
  return items;
}




