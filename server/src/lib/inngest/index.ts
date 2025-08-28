import { Inngest, NonRetriableError } from "inngest";
import { listS3ObjectsByPrefix, objectExists } from "../utils";
import { db } from "../db";
import z from "zod";
import { CREDIT_COSTS } from "@/lib/utils";
import { env } from "bun";

export const inngest = new Inngest({ id: "process-video" });

const processVideoDataSchema = z.object({
  userId: z.string().min(1),
  s3_key: z.string(),
  max_clips: z.number().min(1).optional(),
  projectId: z.string().min(1),
});

const ProcessVideo = inngest.createFunction(
    {
        id: "process-video",
        concurrency: {
            limit: 1,
            key: "event.data.userId",
        },
        retries: 1,
        onFailure: async ({ event, error }) => {
            console.error("Process video function failed after all retries:", error);
            
            try {
                const data = processVideoDataSchema.safeParse(event.data);
                if (data.success) {
                    const { s3_key, userId } = data.data;
                    
                    await db.uploadedFile.update({
                        where: { r2Key: s3_key },
                        data: { status: "failed" },
                    });
                    console.log("Updated file status to failed:", s3_key);

                    await db.user.update({
                        where: { id: userId },
                        data: {
                            credits: {
                                increment: CREDIT_COSTS.CLIP_CREATION
                            }
                        }
                    });
                    console.log("Refunded credit to user:", userId);
                }
            } catch (dbError) {
                console.error("Failed to update status or refund credit on function failure:", dbError);
            }
        },
    },
    { event: "process-video-events" },
    async ({ event, step, logger }) => {
        console.log("Process started Event Data: ", event.data);
        
        const { project, fileExistsInBucket, data } = await step.run("validate-and-check", async () => {
            const data = processVideoDataSchema.parse(event.data);
            const { userId, s3_key, projectId } = data;
            
            const project = await db.projects.findUnique({
                where: {
                    id: projectId,
                    ownerId: userId,
                },
            });
            console.log("Project found: ", project);
            
            const fileExistsInBucket = await objectExists({
                bucket: env.R2_BUCKET_NAME!,
                key: s3_key,
            });
            console.log("File exists in bucket: ", fileExistsInBucket);
            
            if (!fileExistsInBucket || !project) {
                console.error("File does not exist in bucket or project not found");
                throw new NonRetriableError("File does not exist in bucket or project not found");
            }
            
            return { project, fileExistsInBucket, data };
        });

        const { userId, s3_key, max_clips = 1, projectId } = data;

        await step.run("update-uploaded-status", async () => {
            try {
                await db.uploadedFile.update({
                    where: { r2Key: s3_key },
                    data: { uploaded: true },
                });
                console.log("Uploaded file status updated: ", s3_key);
            } catch (error) {
                console.error("Failed to update uploaded status:", error);
                throw error;
            }
        });

        await step.run("set-status-processing", async () => {
            try {
                console.log("Setting status to processing for: ", s3_key);
                await db.uploadedFile.update({
                    where: { r2Key: s3_key },
                    data: { status: "processing" },
                });
            } catch (error) {
                console.error("Failed to set processing status:", error);
                throw error;
            }
        });

        await step.run("process-video-request", async () => {
            const body = {
                s3_key,
                max_clips,
                model: "qwen/qwen3-coder",
            };
            
            const processEndpoint = env.PROCESS_VIDEO_ENDPOINT!;
            const bearer = env.PROCESS_VIDEO_ENDPOINT_AUTH!;
            
            try {
                console.log("Sending request to process video endpoint: ", processEndpoint);
                await step.fetch(processEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${bearer}`,
                    },
                    body: JSON.stringify(body),
                });
            } catch (error) {
                console.log("Error occurred while processing video: ", error);
                await db.uploadedFile.update({
                    where: { r2Key: s3_key },
                    data: { status: "failed" },
                });
                
                await db.user.update({
                    where: { id: userId },
                    data: {
                        credits: {
                            increment: CREDIT_COSTS.CLIP_CREATION
                        }
                    }
                });
                console.log("Refunded credit due to processing error for user:", userId);
                
                throw error; 
            }
        });

        const { clipsFound } = await step.run("store-clips-in-db", async () => {
            try {
                const clips = await listS3ObjectsByPrefix(`${s3_key}`);
                if (clips.length > 0) {
                    const uploadedFile = await db.uploadedFile.findUnique({
                        where: { r2Key: s3_key }
                    });
                    
                    if (!uploadedFile) {
                        throw new NonRetriableError(`UploadedFile with r2Key ${s3_key} not found`);
                    }

                    await db.clip.createMany({
                        data: clips.map((clip) => ({
                            r2Key: clip,
                            userId,
                            uploadedFileId: uploadedFile.id,
                        })),
                    });
                }
                console.log("Clips found: ", clips.length);
                return { clipsFound: clips.length };
            } catch (error) {
                console.error("Failed to store clips in database:", error);
                throw error;
            }
        });

        await step.run("update-final-status", async () => {
            try {
                if (clipsFound > 0) {
                    await db.uploadedFile.update({
                        where: { r2Key: s3_key },
                        data: { status: "completed" },
                    });
                    console.log("Process completed successfully for: ", s3_key);
                } else {
                    await db.uploadedFile.update({
                        where: { r2Key: s3_key },
                        data: { status: "failed" },
                    });
                    
                    await db.user.update({
                        where: { id: userId },
                        data: {
                            credits: {
                                increment: CREDIT_COSTS.CLIP_CREATION
                            }
                        }
                    });
                    console.log("No clips found, marking as failed and refunded credit for: ", s3_key);
                }
            } catch (error) {
                console.error("Failed to update final status:", error);
                throw error;
            }
        });
    }
);

export const functions = [ProcessVideo];
