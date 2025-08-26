import { db } from "@/lib/db";
import type { ProjectCreateInput, ProjectResponse, ProjectsListResponse, ProjectUpdateInput } from "@/lib/schema";
import { randomUUID } from "crypto";
import { v4 as uuidv4 } from "uuid";

export async function createProject(ownerId: string, input: ProjectCreateInput) {
    const id = randomUUID();
    const project = await db.projects.create({
        data: {
            id,
            name: input.name,
            description: input.description ?? null,
            ownerId,
        },
    });
    return project;
}

export async function getProjectById(id: string): Promise<ProjectResponse | null> {
    const project = await db.projects.findUnique({
      where: { 
        id: id 
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          }
        },
        uploadedFile: {
          include: {
            clips: {
              select: {
                id: true,
                r2Key: true,
                createdAt: true,
              }
            }
          }
        }
      }
    });

    if (!project) return null;

    return {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        owner: {
            id: project.owner.id,
            name: project.owner.name || 'Unknown'
        },
        uploadedFile: project.uploadedFile ? {
            id: project.uploadedFile.id,
            r2Key: project.uploadedFile.r2Key,
            displayName: project.uploadedFile.displayName,
            uploaded: project.uploadedFile.uploaded,
            status: project.uploadedFile.status as "queued" | "processing" | "completed" | "failed",
            clips: project.uploadedFile.clips.map(clip => ({
                id: clip.id,
                r2Key: clip.r2Key,
                createdAt: clip.createdAt.toISOString()
            }))
        } : null
    } satisfies ProjectResponse;
}

export async function updateProject(id: string, data: ProjectUpdateInput) {
    return db.projects.update({
        where: { id },
        data: {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.description !== undefined ? { description: data.description } : {}),
        },
    });
}

export async function deleteProject(id: string) {
    return db.projects.delete({ where: { id } });
}

export async function listProjectsByOwner(ownerId: string): Promise<ProjectsListResponse[]> {
    const projects = await db.projects.findMany({
        where: { ownerId },
        orderBy: { createdAt: "desc" },
    });

    return projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
    } satisfies ProjectsListResponse));
}

export async function createProjectWithInitialUpload(params: {
  ownerId: string;
  name: string;
  description?: string | null;
  filename: string;
  contentType?: string;
}) {
  const projectId = randomUUID();
  const fileId = uuidv4();
  const key = `${params.ownerId}/${projectId}/${fileId}/${params.filename}`;

  const [project, uploadedFile] = await db.$transaction([
    db.projects.create({
      data: {
        id: projectId,
        name: params.name,
        description: params.description ?? null,
        ownerId: params.ownerId,
      },
    }),
    db.uploadedFile.create({
      data: {
        id: fileId,
        userId: params.ownerId,
        projectId,
        r2Key: key,
        displayName: params.filename,
        uploaded: false,
        status: "queued",
      },
    }),
  ]);

  return { project, uploadedFile, key };
}