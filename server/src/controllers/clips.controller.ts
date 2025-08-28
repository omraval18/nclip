import { inngest } from "@/lib/inngest";
import type { Context } from "hono";
import { getClips } from "@/services/clips.service";
import { db } from "@/lib/db";
import { apiResponseSchema, getClipsQuerySchema, processClipsReqSchema, type ClipsApiResponse } from "@/lib/schema";
import { canCreateClip, CREDIT_COSTS } from "@/lib/utils";
import { env } from "@/env";

export async function handleClipGeneration(c: Context) {
    const user = await c.get("user");
    if (!user) {
        return c.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (env.NODE_ENV === "development") {
        console.log("Received clip generation request:", c.req);
    }

    const body = await c.req.json();
    const { s3_key, max_clips, projectId } = processClipsReqSchema.parse(body);

    try {
        const userWithDetails = await db.user.findUnique({
            where: { id: user.id },
            select: { credits: true, plan: true }
        });

        if (!userWithDetails) {
            return c.json({ success: false, error: "User not found" }, { status: 404 });
        }

        if (!canCreateClip(userWithDetails.credits)) {
            return c.json({
                success: false, 
                error: "Insufficient credits to process video. Please upgrade your plan or wait for credit refresh.",
                code: "INSUFFICIENT_CREDITS"
            }, { status: 403 });
        }

        await db.user.update({
            where: { id: user.id },
            data: {
                credits: {
                    decrement: CREDIT_COSTS.CLIP_CREATION
                }
            }
        });

        await inngest.send({
            name: "process-video-events",
            data: {
                userId: user.id,
                s3_key,
                max_clips,
                projectId
            }
        });

        return c.json({ success: true, status: "queued" }, { status: 200 });
    } catch (error) {
        console.error("Error in clip generation:", error);
        return c.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function handleGetClipsByProjectId(c: Context) {
    const user = await c.get("user");
    if (!user) return c.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const projectId = c.req.param("projectId") ?? c.req.param("id");
    if (!projectId) return c.json({ success: false, error: "Project id is required" }, { status: 400 });

    try {
        const queryParams = getClipsQuerySchema.parse({
            page: c.req.query("page"),
            limit: c.req.query("limit") ?? c.req.query("perPage"),
            offset: c.req.query("offset")
        });

        const { page, limit } = queryParams;
        const offset = queryParams.offset ?? (page - 1) * limit;

        const clips = await getClips({
            userId: user.id,
            projectId,
            limit,
            offset,
        });

        const response: ClipsApiResponse = {
            success: true,
            clips
        };

        const validatedResponse = apiResponseSchema.parse(response);
        return c.json(validatedResponse, { status: 200 });
    } catch (error: any) {
        console.error("error fetching clips:", error);
        const msg = String(error?.message ?? error);
        if (msg.includes("Project not found") || msg.includes("access denied")) {
            return c.json({ success: false, error: "Project not found or access denied" }, { status: 404 });
        }
        return c.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}