import { revalidateApiResponseSchema, statusRevalidateParamSchema, uploadApiResponseSchema, uploadUrlRequestSchema, type RevalidateApiResponse, type UploadApiResponse } from "@/lib/schema";
import { generateUploadUrl, revalidateUploadStatus } from "@/services/upload.service";
import { type Context } from "hono";

export async function handleGenerateUploadUrl(c: Context) {
  const user = await c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const body = await c.req.json();
    
    const validatedBody = uploadUrlRequestSchema.parse(body);
    const { filename, contentType, projectName, projectDescription } = validatedBody;

    const result = await generateUploadUrl({
      userId: user.id,
      filename,
      contentType,
      projectName,
      projectDescription,
    });

    const response: UploadApiResponse = { 
      success: true, 
      signedUrl: result.signedUrl,
      key: result.key,
      uploadedFileId: result.uploadedFileId,
      project: result.project
    };

    const validatedResponse = uploadApiResponseSchema.parse(response);
    return c.json(validatedResponse, { status: 200 });
  } catch (error: any) {
    console.error("Error generating upload URL:", error);
    return c.json({ 
      success: false, 
      error: error.message || "Failed to generate upload URL" 
    }, { status: 400 });
  }
}

export async function revalidateStatus(c: Context) {
  const user = await c.get("user");
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  try {
    const paramValidation = statusRevalidateParamSchema.safeParse({ 
      id: c.req.param("id") 
    });
    
    if (!paramValidation.success) {
      return c.json({
        success: false, 
        error: "Invalid project ID"
      }, { status: 400 });
    }

    const uploadedFile = await revalidateUploadStatus(paramValidation.data.id);

    const response: RevalidateApiResponse = { 
      success: true, 
      uploadedFile 
    };

    const validatedResponse = revalidateApiResponseSchema.parse(response);
    return c.json(validatedResponse, { status: 200 });
  } catch (error: any) {
    console.error("Error revalidating upload status:", error);
    return c.json({ 
      success: false, 
      error: error.message || "Failed to revalidate upload status" 
    }, { status: 500 });
  }
}