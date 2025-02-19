import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalMutation, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

 

// get every episode without years
// put gemini requests in a table
// than run gemini requests - and save response in table

// add to episode scheme, years, podcast_title, episode_title, episode_description, geonames, location, time_period
// start job to about years from gemini response
// fill in all new columns
// fill in time spans - api.everwhz.timeline

export const geminiHistoryByPodcast = internalAction({
    args: {
        podcast_id: v.id("podcast")
    },
    handler: async (ctx, args) => {
        const episodes = await ctx.runQuery(internal.gemini.get10Episodes, {
            podcast_id: args.podcast_id
        });
        const items = episodes.map(episode => ({
            id: episode._id,
            title: episode.title ?? "Untitled",
            description: episode.body?.description ?? ""
        }));
        const response = await geminiHistory(items);
        return response;
    }
}); 

export const get10Episodes = internalQuery({
    args: {
        podcast_id: v.id("podcast")
    },
    handler: async (ctx, args) => {
        const episodes = await ctx.db.query("episode")
            .withIndex("podcast_episode_number", q => q.eq("podcast_id", args.podcast_id))
            .take(10);
        return episodes;
    }
}); 

export async function geminiHistory(
    items: Array<{
        id: Id<"episode">,
        title: string,
        description: string
    }>
): Promise<any> {
    const genAI = new GoogleGenerativeAI("AIzaSyDJA8p-kNXjviC_4jyuZljDhaGbjcoxxXU");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
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

    const result = await model.generateContent(prompt);
    console.log(result.response.text());
    return await result.response.text();
} 