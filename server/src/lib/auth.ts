import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
    trustedOrigins: [process.env.CORS_ORIGIN || ""],
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            plan: {
                type: "string",
                required: true,
                defaultValue: "free",
                input:false
            },
            credits: {
                type: "number",
                required: true,
                defaultValue: 5,
                input:false
            },
        },
    },
});


export type AuthType = {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
};


