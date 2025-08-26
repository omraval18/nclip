import { Hono } from "hono";
import { handleGenerateUploadUrl } from "../controllers/upload.controller";
import { handleClipGeneration, handleGetClipsByProjectId } from "@/controllers/clips.controller";

export const clipRoutes = new Hono();

clipRoutes.post("/clips/queue", handleClipGeneration);
clipRoutes.get("/clips/:id", handleGetClipsByProjectId);
