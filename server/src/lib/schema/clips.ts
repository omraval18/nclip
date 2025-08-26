import { z } from "zod";

export const clipCreateSchema = z.object({
  uploadedFileId: z.string().optional(),
  r2Key: z.string().min(1).optional(),
  filename: z.string().min(1).optional()
});

export const clipUpdateSchema = z.object({
  uploadedFileId: z.string().optional().nullable(),
  r2Key: z.string().min(1).optional()
}).strict();

export const clipIdParamSchema = z.object({
  id: z.string().min(1)
});

export const clipResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  r2Key: z.string(),
  createdAt: z.string()
});

export const clipsPageResponseSchema = z.object({
  clips: z.array(clipResponseSchema),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
  totalCount: z.number().int().min(0).optional(),
  hasMore: z.boolean().optional()
});

export const getClipsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.max(1, Math.min(100, parseInt(val, 10))) : 20),
  offset: z.string().optional().transform(val => val ? Math.max(0, parseInt(val, 10)) : undefined)
});

export const processClipsReqSchema = z.object({
  s3_key: z.string().min(5),
  max_clips: z.number().min(1).optional(),
  projectId: z.string().min(1)
});

export const apiResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  clips: z.array(clipResponseSchema).optional()
});

export type ClipCreateInput = z.infer<typeof clipCreateSchema>;
export type ClipUpdateInput = z.infer<typeof clipUpdateSchema>;
export type ClipResponse = z.infer<typeof clipResponseSchema>;
export type ClipsPageResponse = z.infer<typeof clipsPageResponseSchema>;
export type GetClipsQuery = z.infer<typeof getClipsQuerySchema>;
export type ProcessClipsRequest = z.infer<typeof processClipsReqSchema>;
export type ClipsApiResponse = z.infer<typeof apiResponseSchema>;