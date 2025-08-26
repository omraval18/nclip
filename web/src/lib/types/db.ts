export type Status = "queued" | "processing" | "completed" | "failed";

export const STATUS: Readonly<Record<Status, Status>> = {
  queued: "queued",
  processing: "processing",
  completed: "completed",
  failed: "failed",
} as const;


export interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;

  uploadedFile?: UploadedFile | null;
}

export interface UploadedFile {
  id: string;
  r2Key: string;
  displayName?: string | null;
  uploaded: boolean;
  status: Status;
  createdAt: string; 
  updatedAt: string;

 
  clips?: Clip[];
  projectId: string;
  userId: string;
}

export interface Clip {
  id: string;
  r2Key: string;
  createdAt: string; 
  updatedAt: string; 

  uploadedFileId?: string | null;
  userId: string;
}
