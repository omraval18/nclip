import { projectApiResponseSchema, type ProjectClip, type ProjectOwner, type ProjectResponse, type ProjectsListResponse, type ProjectUpdateInput } from "@/lib/schema/project";
import type { UploadedFile } from "@/lib/types/db";

export type Project = ProjectResponse;
export type ProjectsList = ProjectsListResponse;
export { type ProjectOwner, type ProjectClip, type UploadedFile, type ProjectUpdateInput };

export async function fetchProject(projectId: string): Promise<Project> {
    if (!projectId) throw new Error("projectId is required");
    const res = await fetch(`${import.meta.env.BASE_API!}/api/project/${encodeURIComponent(projectId)}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
    
    const body = await res.json();
    
    const validatedResponse = projectApiResponseSchema.parse(body);
    
    if (!validatedResponse.success || !validatedResponse.project) {
        throw new Error(validatedResponse.error || "Failed to fetch project");
    }
    
    return validatedResponse.project;
}

export async function fetchProjects(): Promise<ProjectsList[]> {
    const res = await fetch(`${import.meta.env.BASE_API!}/api/projects`, {
        credentials: "include",
        headers: { Accept: "application/json" },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch projects: ${res.status} ${text}`);
    }
    
    const body = await res.json();
    
    const validatedResponse = projectApiResponseSchema.parse(body);
    
    if (!validatedResponse.success || !validatedResponse.projects) {
        throw new Error(validatedResponse.error || "Invalid response");
    }
    
    return validatedResponse.projects;
}

export async function updateProject(projectId: string, data: ProjectUpdateInput): Promise<Project> {
    if (!projectId) throw new Error("projectId is required");
    const res = await fetch(
        `${import.meta.env.BASE_API!}/api/project/${encodeURIComponent(projectId)}`,
        {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(data),
        }
    );
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to update project: ${res.status} ${text}`);
    }
    
    const body = await res.json();
    
    const validatedResponse = projectApiResponseSchema.parse(body);
    
    if (!validatedResponse.success || !validatedResponse.project) {
        throw new Error(validatedResponse.error || "Failed to update project");
    }
    
    return validatedResponse.project;
}