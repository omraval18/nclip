import { Hono } from "hono";
import { handleGenerateUploadUrl, revalidateStatus } from "../controllers/upload.controller";

export const uploadRoutes = new Hono();

uploadRoutes.post("/upload/url", handleGenerateUploadUrl);
uploadRoutes.get("/upload/status/revalidate/:id", revalidateStatus);
