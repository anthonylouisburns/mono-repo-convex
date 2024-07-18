import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import GitHub from "@auth/core/providers/github";


export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google, GitHub],
  callbacks: {
    async redirect({ redirectTo }) {
      return redirectTo;
    },
  },
});
