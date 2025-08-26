import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";


export const authClient = createAuthClient({
  baseURL:
      import.meta.env.VITE_SERVER_URL,
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
