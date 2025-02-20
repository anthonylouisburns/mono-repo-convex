import OpenAI from "openai";
import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { missingEnvVariableUrl } from "./utils";

export const getSuggestions = internalAction({
  handler: async (ctx) => {
    const podcasts = await ctx.runQuery(api.everwhz.podcasts);
    const podcasts_list = podcasts
      .map((p) => {
        p.rss_url;
      })
      .join(",");
    console.log(podcasts_list);
    const prompt = `Take in the following list of rss links for history podcasts and return a list of other podcasts: ${podcasts_list}`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const error = missingEnvVariableUrl(
        "OPENAI_API_KEY",
        "https://platform.openai.com/account/api-keys",
      );
      console.error(error);
      return;
    }
    const openai = new OpenAI({ apiKey });
    const output = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant designed to output JSON in this format: List<string>",
        },
        { role: "user", content: prompt },
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    // Pull the message content out of the response
    const messageContent = output.choices[0]?.message.content;

    console.log({ messageContent });

    const parsedOutput = JSON.parse(messageContent!);
    console.log({ parsedOutput });

    await ctx.runMutation(internal.everwhz_ai.saveSuggestions, {
      suggestions: parsedOutput.summary,
    });
  },
});

export const saveSuggestions = internalMutation({
  args: {
    suggestions: v.array(v.string()),
  },
  handler: async (ctx, { suggestions }) => {
    await ctx.db.insert("podcast_suggestions", {
      suggestions: suggestions,
    });
  },
});
