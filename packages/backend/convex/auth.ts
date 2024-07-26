import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import GitHub from "@auth/core/providers/github";
import Apple from "@auth/core/providers/apple";


export const { auth, signIn, signOut, store } = convexAuth({

  providers: [Google, GitHub,
    Apple({
      clientSecret: process.env.AUTH_APPLE_SECRET!,
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      profile: undefined,
    }),
  ],
  callbacks: {
    async redirect({ redirectTo }) {
      console.log('redirectTo:', redirectTo)
      return redirectTo;
    },
  },
});
