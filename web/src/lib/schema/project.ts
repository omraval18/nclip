import { z } from "zod";

export const projectCreateSchema = z.object({
    name: z.string().min(1, "name is required"),
    description: z.string().optional(),
    uploadedFileId: z.string().optional(),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
}).strict();

export const projectIdParamSchema = z.object({
  id: z.string().min(1)
});

export const projectOwnerSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const projectClipSchema = z.object({
  id: z.string(),
  r2Key: z.string(),
  createdAt: z.string()
});

export const uploadedFileSchema = z.object({
  id: z.string(),
  r2Key: z.string(),
  displayName: z.string().nullable(),
  uploaded: z.boolean(),
  status: z.enum(["queued", "processing", "completed", "failed"]),
  clips: z.array(projectClipSchema)
});

export const projectResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  ownerId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  owner: projectOwnerSchema,
  uploadedFile: uploadedFileSchema.nullable().optional(),
});

export const projectsListResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  ownerId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const projectApiResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  project: projectResponseSchema.optional(),
  projects: z.array(projectsListResponseSchema).optional()
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
export type ProjectOwner = z.infer<typeof projectOwnerSchema>;
export type ProjectClip = z.infer<typeof projectClipSchema>;
export type UploadedFileType = z.infer<typeof uploadedFileSchema>;
export type ProjectsListResponse = z.infer<typeof projectsListResponseSchema>;
export type ProjectApiResponse = z.infer<typeof projectApiResponseSchema>;