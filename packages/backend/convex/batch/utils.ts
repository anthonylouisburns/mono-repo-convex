import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { internalMutation, internalQuery, mutation } from "../_generated/server";

export const deleteOldFiles = mutation({
    handler: async (ctx) => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const oldFiles = await ctx.db.system.query("_storage")
        .filter((q) => q.lt(q.field("_creationTime"), oneWeekAgo.getTime()))
        .collect();
  
      for (const file of oldFiles) {
        await ctx.storage.delete(file._id);
      }
  
      return `Deleted ${oldFiles.length} files older than one week.`;
    },
  });

  export const deleteOldData = internalMutation({
    args: {},
    handler: async (ctx) => {
        await ctx.runMutation(api.batch.utils.deleteOldFiles);
        // [ ] delete data from old jobs
    },
  });

  export const saveWork = internalMutation({
    args: {
      type: v.string(),
      summary: v.any(),
    },
    handler: async (ctx, args) => {
      await ctx.db.insert("work", {
        type: args.type,
        summary: args.summary,
      });
    },
  });

  export const createJob = internalMutation({
    args: {
      type: v.string(),
      data: v.optional(v.any()),
      instructions: v.optional(v.any()),
      status: v.optional(v.string()),
      error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
      await ctx.db.insert("job", {
        type: args.type,
        data: args.data,
        instructions: args.instructions,
        status: args.status,
        error: args.error,
      });
    },
  });

  export const updateJob = internalMutation({
    args: {
      id: v.id("job"),
      status: v.optional(v.string()),
      error: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
      await ctx.db.patch(args.id, {
        status: args.status,
        error: args.error,
      });
    },
  });

  export const getNextJob = internalQuery({
    args: {},
    handler: async (ctx) => {
      // [ ] sort asc
      const job = await ctx.db.query("job").withIndex("status", (q) => q.eq("status", undefined)).order("desc").first();
      return job;
    },
  });

  export const getJobById = internalQuery({
    args: { job_id: v.id("job") },
    handler: async (ctx, args) => {
      const job = await ctx.db.get(args.job_id);
      return job;
    },
  });