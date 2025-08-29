import { revalidateApiResponseSchema, uploadApiResponseSchema, type UploadedFileResponse, type UploadUrlRequest, type UploadUrlResponse } from "@/lib/schema/upload";
import { env } from "../env";

export { type UploadUrlRequest, type UploadUrlResponse, type UploadedFileResponse };

export async function generateUploadUrl(request: UploadUrlRequest): Promise<UploadUrlResponse> {
    const res = await fetch(`${env.VITE_BASE_API}/api/upload/url`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to generate upload URL: ${res.status} ${text}`);
    }

    const body = await res.json();
    
    const validatedResponse = uploadApiResponseSchema.parse(body);
    
    if (!validatedResponse.success || !validatedResponse.signedUrl || !validatedResponse.project) {
        throw new Error(validatedResponse.error || "Invalid response from upload URL API");
    }

    return {
        signedUrl: validatedResponse.signedUrl,
        key: validatedResponse.key!,
        uploadedFileId: validatedResponse.uploadedFileId!,
        project: validatedResponse.project
    };
}

export async function revalidateUploadStatus(projectId: string): Promise<UploadedFileResponse> {
    const res = await fetch(
        `${env.VITE_BASE_API}/api/upload/status/revalidate/${encodeURIComponent(projectId)}`,
        {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to revalidate upload status: ${res.status} ${text}`);
    }

    const body = await res.json();
    
    const validatedResponse = revalidateApiResponseSchema.parse(body);
    
    if (!validatedResponse.success || !validatedResponse.uploadedFile) {
        throw new Error(validatedResponse.error || "Invalid response from revalidate API");
    }

    return validatedResponse.uploadedFile;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percent: number;
}

export function uploadWithXHR({
    url,
    file,
    headers = {},
    onProgress,
}: {
    url: string;
    file: File | Blob;
    headers?: Record<string, string>;
    onProgress?: (info: UploadProgress) => void;
}): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress({ loaded: e.loaded, total: e.total, percent });
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload aborted"));

        xhr.open("PUT", url, true);
        Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        xhr.send(file);
    });
}