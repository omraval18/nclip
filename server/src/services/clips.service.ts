import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { getProjectById } from "./project.service";
import { S3Client } from "@aws-sdk/client-s3";
import { listS3ObjectsByPrefix } from "@/lib/utils";
import { getSignedUrlForKey, r2 } from "@/lib/r2-client";
import { clipCreateSchema, clipUpdateSchema, type ClipCreateInput, type ClipResponse, type ClipUpdateInput } from "@/lib/schema";

interface GetClipsByProjectType  {
    userId: string;
    projectId: string;
    uploadedFileId?: string;
    limit?: number;
    offset?: number;
}

function deriveClipR2Key(params: {
    userId: string;
    uploadedFileR2Key?: string | null;
    filename?: string;
    clipId: string;
}): string {
    if (params.uploadedFileR2Key && params.filename) {
        const parts = params.uploadedFileR2Key.split("/");
        if (parts.length >= 4) {
            const base = parts.slice(0, 3).join("/");
            return `${base}/clips/${params.clipId}/${params.filename}`;
        }
    }
    return `${params.userId}/clips/${params.clipId}${params.filename ? `/${params.filename}` : ""}`;
}

export async function createClip(userId: string, input: ClipCreateInput) {
    const data = clipCreateSchema.parse(input);

    let uploadedFile: { id: string; r2Key: string } | null = null;
    if (data.uploadedFileId) {
        uploadedFile = (await db.uploadedFile.findUnique({
            where: { id: data.uploadedFileId },
            select: { id: true, r2Key: true, userId: true },
        })) as any;
        if (!uploadedFile) throw new Error("uploadedFile not found");
    }

    const clipId = randomUUID();
    const r2Key =
        data.r2Key ??
        deriveClipR2Key({
            userId,
            uploadedFileR2Key: uploadedFile?.r2Key,
            filename: data.filename,
            clipId,
        });

    const clip = await db.clip.create({
        data: {
            id: clipId,
            r2Key,
            userId,
            uploadedFileId: uploadedFile ? uploadedFile.id : null,
        },
    });

    return clip;
}

export async function getClipById(id: string) {
    return db.clip.findUnique({ where: { id } });
}

export async function updateClip(userId: string, id: string, input: ClipUpdateInput) {
    const data = clipUpdateSchema.parse(input);

    const existing = await db.clip.findUnique({ where: { id } });
    if (!existing) throw new Error("not_found");
    if (existing.userId !== userId) throw new Error("forbidden");

    if (data.uploadedFileId) {
        const uf = await db.uploadedFile.findUnique({
            where: { id: data.uploadedFileId },
            select: { id: true, userId: true },
        });
        if (!uf) throw new Error("uploaded_file_not_found");
        if (uf.userId !== userId) throw new Error("forbidden");
    }

    const clip = await db.clip.update({
        where: { id },
        data: {
            ...(data.r2Key !== undefined ? { r2Key: data.r2Key } : {}),
            ...(data.uploadedFileId !== undefined
                ? { uploadedFileId: data.uploadedFileId ?? null }
                : {}),
        },
    });

    return clip;
}

export async function deleteClip(userId: string, id: string) {
    const existing = await db.clip.findUnique({ where: { id } });
    if (!existing) throw new Error("not_found");
    if (existing.userId !== userId) throw new Error("forbidden");
    await db.clip.delete({ where: { id } });
    return true;
}

export async function listClipsByUploadedFile(userId: string, uploadedFileId: string) {
    const uf = await db.uploadedFile.findUnique({
        where: { id: uploadedFileId },
        select: { id: true, userId: true },
    });
    if (!uf) throw new Error("uploaded_file_not_found");
    if (uf.userId !== userId) throw new Error("forbidden");

    return db.clip.findMany({
        where: { uploadedFileId },
        orderBy: { createdAt: "desc" },
    });
}

export async function listClipsByUser(userId: string) {
    return db.clip.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
}


export async function getClips({
    userId,
    projectId,
    uploadedFileId,
    limit = 20,
    offset = 0,
}: GetClipsByProjectType): Promise<ClipResponse[]> {
    const project = await getProjectById(projectId);

    if (!project || project.ownerId !== userId) {
        throw new Error("Project not found or access denied");
    }
    if (!project.uploadedFile) return [];

    const uploadedFile = project.uploadedFile;
    const ufKey = uploadedFile.r2Key;
    const bucket = process.env.R2_BUCKET_NAME!;
    if (!bucket) throw new Error("R2_BUCKET_NAME not set");

    const clipsInDB = await db.clip.findMany({
        where: {
            userId,
            uploadedFileId: uploadedFile.id,
        },
        orderBy: { createdAt: "asc" },
        skip: offset,
        take: limit,
    });

    if (clipsInDB.length === 0) {
        const clipsInBucket = await listS3ObjectsByPrefix(ufKey);
        if (!clipsInBucket || clipsInBucket.length === 0) return [];

        const createData = clipsInBucket.map((clip) => ({
            r2Key: clip,
            userId,
            uploadedFileId: uploadedFile.id,
        }));
        await db.clip.createMany({ data: createData, skipDuplicates: true });

        const paginatedKeys = clipsInBucket.slice(offset, offset + limit);
        const results = await Promise.all(
            paginatedKeys.map(async (key) => {
                const url = await getSignedUrlForKey(r2 as unknown as S3Client, bucket, key);
                const name = key.split("/").pop() || key;
                const dbRow = await db.clip.findFirst({ where: { r2Key: key, uploadedFileId: uploadedFile.id }, select: { id: true, createdAt: true } });
                return {
                    id: dbRow?.id ?? key,
                    name,
                    url,
                    r2Key: key,
                    createdAt: (dbRow?.createdAt ?? new Date()).toISOString(),
                } satisfies ClipResponse;
            })
        );

        return results;
    }

    const results = await Promise.all(
        clipsInDB.map(async (clip) => {
            const key = String(clip.r2Key);
            const url = await getSignedUrlForKey(r2 as unknown as S3Client, bucket, key);
            const name = key.split("/").pop() || key;
            return {
                id: clip.id,
                name,
                url,
                r2Key: key,
                createdAt: clip.createdAt.toISOString(),
            } satisfies ClipResponse;
        })
    );

    return results;
}