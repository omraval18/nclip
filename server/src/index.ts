import "dotenv/config";
import { auth, type AuthType } from "./lib/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { uploadRoutes } from "./routers/upload.routes";
import { clipRoutes } from "./routers/clip.routes";
import { serve } from "inngest/hono";
import { functions, inngest } from "./lib/inngest";
import { projectRoutes } from "./routers/project.routes";
import { env } from "./env";

const app = new Hono<{
	Variables: AuthType
}>();

if (env.NODE_ENV === "development") {
  app.use(logger());
}

if (env.NODE_ENV === "development") {
  console.log("CORS_ORIGIN:", env.CORS_ORIGIN);
}

app.use("/*", cors({
  origin: env.CORS_ORIGIN,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use("*", async (c, next) => {
    if (c.req.path.startsWith("/api/inngest")) {
        return next();
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
        if (env.NODE_ENV === "development") {
          console.error("No session found, user is not authenticated");
        }
        c.set("user", null);
        c.set("session", null);
        return next();
    }

    c.set("user", session.user);
    c.set("session", session.session);
    return next();
});

app.on(
    ["GET", "PUT", "POST"],
    "/api/inngest",
    serve({
        client: inngest,
        functions,
    })
);
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));
app.route("/api/", uploadRoutes)
app.route("/api/", clipRoutes);
app.route("/api/",projectRoutes)


app.get("/", (c) => {
  return c.text("OK");
});

export default app;
