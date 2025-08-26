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

const app = new Hono<{
	Variables: AuthType
}>();

app.use(logger());
app.use("/*", cors({
  origin: process.env.CORS_ORIGIN || "",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use("*", async (c, next) => {
    if (c.req.path.startsWith("/api/inngest")) {
        return next();
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
        console.error("No session found, user is not authenticated");
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
