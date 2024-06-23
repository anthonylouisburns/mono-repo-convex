import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const getAudio = httpAction(async (ctx, request) => {
  const { body } = await request.json();
  console.log(body)
//   request(body.src).pip
  return new Response(null, {
    status: 200,
  });
});