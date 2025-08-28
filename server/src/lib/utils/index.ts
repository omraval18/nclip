import {
    S3Client,
    ListObjectsV2Command,
    type ListObjectsV2CommandInput,
    HeadObjectCommand,
    type _Object,
    type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import { env } from "bun";

export function getFileNameFromRelative(relativePath: string): string {
    return (
        relativePath
            .replace(/^\.\/+/, "")
            .split("/")
            .pop() ?? ""
    );
}

export const handleApiError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

export const isValidationError = (error: unknown): boolean => {
    return error instanceof Error && error.name === "ZodError";
};

export async function objectExists(params: { bucket: string; key: string }) {
    const { bucket, key } = params;
    try {
        const endpoint = env.BUCKET_ENDPOINT!;
        const s3 = new S3Client({
            credentials: {
                accessKeyId: env.BUCKET_ACCESS_KEY!,
                secretAccessKey: env.BUCKET_ACCESS_SECRET!,
            },
            endpoint,
            region: "us-east-1",
            forcePathStyle: false,
        });

        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return true;
    } catch (err: any) {
        if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") {
            return false;
        }

        throw err;
    }
}

export async function listS3ObjectsByPrefix(prefix: string): Promise<string[]> {
    const bucket = env.R2_BUCKET_NAME;
    if (!bucket) throw new Error("env.S3_BUCKET_NAME is not set");

    const endpoint = env.BUCKET_ENDPOINT!;
    const s3 = new S3Client({
        credentials: {
            accessKeyId: env.BUCKET_ACCESS_KEY!,
            secretAccessKey: env.BUCKET_ACCESS_SECRET!,
        },
        endpoint,
        region: "us-east-1",
        forcePathStyle: false,
    });

    const normalized = prefix.replace(/^\/+/, "");
    let searchPrefix: string;
    if (prefix.endsWith("/")) {
        searchPrefix = normalized.endsWith("/") ? normalized : `${normalized}/`;
    } else {
        const parts = normalized.split("/").filter(Boolean);
        const parentParts = parts.slice(0, -1);
        searchPrefix = parentParts.length ? `${parentParts.join("/")}/` : "";
    }

    const keys: string[] = [];
    let continuationToken: string | undefined = undefined;

    do {
        const listCommand = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: searchPrefix,
            ContinuationToken: continuationToken,
        });

        const response: ListObjectsV2CommandOutput = await s3.send(listCommand);
        const contents: _Object[] = response.Contents ?? [];

        for (const item of contents) {
            const k = item.Key;
            if (!k) continue;
            if (k.toLowerCase().includes("clip")) keys.push(k);
        }

        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return keys;
}

export * from "./credits";
