import { useMutation } from "@tanstack/react-query";
import { 
    generateUploadUrl, 
    revalidateUploadStatus,
    type UploadUrlRequest, 
    type UploadUrlResponse,
    type UploadedFileResponse 
} from "@/lib/api/upload";

export function useGenerateUploadUrl() {
    return useMutation<UploadUrlResponse, Error, UploadUrlRequest>({
        mutationFn: generateUploadUrl,
        onError: (error) => {
            console.error('Failed to generate upload URL:', error);
        }
    });
}

export function useRevalidateUploadStatus() {
    return useMutation<UploadedFileResponse, Error, string>({
        mutationFn: revalidateUploadStatus,
        onError: (error) => {
            console.error('Failed to revalidate upload status:', error);
        }
    });
}