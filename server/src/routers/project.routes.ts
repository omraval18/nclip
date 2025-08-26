import { Hono } from "hono";
import { handleGenerateUploadUrl } from "../controllers/upload.controller";
import { handleClipGeneration } from "@/controllers/clips.controller";
import { getProjectsByUserId, handleGetProject, handleUpdateProject } from "@/controllers/project.controller";

export const projectRoutes = new Hono();

projectRoutes.get("/project/:id", handleGetProject);
projectRoutes.get("/projects",getProjectsByUserId)
projectRoutes.post("/project/update", handleUpdateProject)
