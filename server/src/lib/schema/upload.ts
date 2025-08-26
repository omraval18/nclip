import z from "zod";

export const createUploadSchema = z.object({
  r2Key: z.string().min(1, "r2Key is required"),
  displayName: z.string().optional(),
  userId: z.string().min(1, "userId is required"),
  uploaded: z.boolean().default(false),
  projectId: z.string().min(1, "projectId is required"),
  status: z.enum(["queued", "processing", "completed", "failed"]).default("queued"),
});

export const uploadUrlRequestSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  contentType: z.string().min(1, "Content type is required"),
  projectName: z.string().min(1).optional(),
  projectDescription: z.string().optional(),
});

export const uploadUrlResponseSchema = z.object({
  signedUrl: z.string().url(),
  key: z.string().min(1),
  uploadedFileId: z.string().min(1),
  project: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    ownerId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
});

export const uploadedFileResponseSchema = z.object({
  id: z.string(),
  r2Key: z.string(),
  displayName: z.string().nullable(),
  uploaded: z.boolean(),
  status: z.enum(["queued", "processing", "completed", "failed"]),
  userId: z.string(),
  projectId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const statusRevalidateParamSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
});

export const uploadApiResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  signedUrl: z.string().optional(),
  key: z.string().optional(),
  uploadedFileId: z.string().optional(),
  project: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    ownerId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
});

export const revalidateApiResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  uploadedFile: uploadedFileResponseSchema.optional(),
});

export type CreateUploadInput = z.infer<typeof createUploadSchema>;
export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;
export type UploadedFileResponse = z.infer<typeof uploadedFileResponseSchema>;
export type StatusRevalidateParam = z.infer<typeof statusRevalidateParamSchema>;
export type UploadApiResponse = z.infer<typeof uploadApiResponseSchema>;
export type RevalidateApiResponse = z.infer<typeof revalidateApiResponseSchema>;