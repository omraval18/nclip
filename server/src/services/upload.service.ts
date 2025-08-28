import { db } from "@/lib/db";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2-client";
import { createProjectWithInitialUpload, getProjectById } from "./project.service";
import { listS3ObjectsByPrefix } from "@/lib/utils";
import { createUploadSchema, type CreateUploadInput, type UploadedFileResponse, type UploadUrlResponse } from "@/lib/schema";
import { env } from "@/env";

type GenerateUploadParams = {
  userId: string;
  filename: string;
  contentType: string;
  projectName?: string;
  projectDescription?: string;
};

export async function createUpload(data: CreateUploadInput) {
  const validated = createUploadSchema.parse(data);

  const upload = await db.uploadedFile.create({
    data: {
      r2Key: validated.r2Key,
      displayName: validated.displayName,
      userId: validated.userId,
      uploaded: validated.uploaded,
      status: validated.status,
      projectId: validated.projectId,
    },
  });

  return upload;
}

export async function generateUploadUrl({
  userId,
  filename,
  contentType,
  projectName,
  projectDescription,
}: GenerateUploadParams): Promise<UploadUrlResponse> {
  const { project, uploadedFile, key } = await createProjectWithInitialUpload({
    ownerId: userId,
    name: projectName || filename, // Use provided name or fallback to filename
    description: projectDescription || null,
    filename,
    contentType,
  });

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: "application/octet-stream",
  });
  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

  return {
    signedUrl,
    key,
    uploadedFileId: uploadedFile.id,
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }
  } satisfies UploadUrlResponse;
}

export async function revalidateUploadStatus(projectId: string): Promise<UploadedFileResponse> {
  const project = await getProjectById(projectId);

  if (!project || !project.uploadedFile) {
    throw new Error("Project or uploaded file not found");
  }

  const uploadedFile = project.uploadedFile;
  const key = uploadedFile.r2Key;

  const clips = await listS3ObjectsByPrefix(`${key}`);

  let finalUploadedFile;

  if (clips.length > 0) {
    if (uploadedFile.uploaded !== true || uploadedFile.status !== "completed") {
      finalUploadedFile = await db.uploadedFile.update({
        where: { id: uploadedFile.id },
        data: { uploaded: true, status: "completed" },
      });
    } else {
      finalUploadedFile = await db.uploadedFile.findUnique({
        where: { id: uploadedFile.id }
      });
    }
  } else {
    if (uploadedFile.uploaded !== false || uploadedFile.status !== "failed") {
      finalUploadedFile = await db.uploadedFile.update({
        where: { id: uploadedFile.id },
        data: { uploaded: false, status: "failed" },
      });
    } else {
      finalUploadedFile = await db.uploadedFile.findUnique({
        where: { id: uploadedFile.id }
      });
    }
  }

  if (!finalUploadedFile) {
    throw new Error("Failed to retrieve uploaded file");
  }

  return {
    id: finalUploadedFile.id,
    r2Key: finalUploadedFile.r2Key,
    displayName: finalUploadedFile.displayName,
    uploaded: finalUploadedFile.uploaded,
    status: finalUploadedFile.status as "queued" | "processing" | "completed" | "failed",
    userId: finalUploadedFile.userId,
    projectId: finalUploadedFile.projectId,
    createdAt: finalUploadedFile.createdAt.toISOString(),
    updatedAt: finalUploadedFile.updatedAt.toISOString(),
  } satisfies UploadedFileResponse;
}