import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { env } from "process";


export const authClient = createAuthClient({
  baseURL: env.VITE_BASE_API,
  plugins: [
    inferAdditionalFields({
      user: {
        plan: {
          type: "string",
          input:false
        },
        credits: {
          type: "number",
          input:false
        }
      }
    })
  ]
});
