import { httpAction } from "./_generated/server";

export const getAudio = httpAction(async (ctx, request) => {
  const { body } = await request.json();
  console.log(body, ctx)
//   request(body.src).pip
  return new Response(null, {
    status: 200,
  });
});
