import {
  createProject,
  getProjectById,
  listProjectsByOwner,
  updateProject,
} from "@/services/project.service";
import type { Context } from "hono";
import { db } from "@/lib/db";
import { projectApiResponseSchema, projectCreateSchema, projectIdParamSchema, projectUpdateSchema, type ProjectApiResponse } from "@/lib/schema";
import { canCreateProject, getMaxProjectsForPlan, type UserPlan } from "@/lib/utils";

export async function handleCreateProject(c: Context) {
  const user = await c.get("user");
  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await c.req.json();
  const parsedBody = projectCreateSchema.parse(body);
  const { name, description, uploadedFileId } = parsedBody;
  if (!name || typeof name !== "string" || name.length < 1) {
    return c.json(
      { success: false, error: "Invalid project name" },
      { status: 400 },
    );
  }

  try {
    const userWithDetails = await db.user.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: { projects: true }
        }
      }
    });

    if (!userWithDetails) {
      return c.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userPlan = userWithDetails.plan as UserPlan;
    const currentProjectCount = userWithDetails._count.projects;
    
    if (!canCreateProject(currentProjectCount, userPlan)) {
      const maxProjects = getMaxProjectsForPlan(userPlan);
      const message = maxProjects === -1 
        ? "Unable to create project" 
        : `You've reached your project limit (${maxProjects}). Upgrade your plan to create more projects.`;
      
      return c.json(
        { success: false, error: message, code: "PROJECT_LIMIT_EXCEEDED" },
        { status: 403 }
      );
    }

    const project = await createProject(user.id, {
      name,
      description,
      uploadedFileId,
    });
    return c.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return c.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function handleGetProject(c: Context) {
  const user = await c.get("user");
  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const paramValidation = projectIdParamSchema.safeParse({ 
      id: c.req.param("id") 
    });
    
    if (!paramValidation.success) {
      return c.json(
        { success: false, error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const project = await getProjectById(paramValidation.data.id);
    
    if (!project) {
      return c.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const response: ProjectApiResponse = { success: true, project };
    const validatedResponse = projectApiResponseSchema.parse(response);
    
    return c.json(validatedResponse, { status: 200 });
  } catch (error) {
    console.error("Error fetching project:", error);
    return c.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function getProjectsByUserId(c: Context) {
  const user = await c.get("user");

  if (!user || !user.id) {
    return c.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await listProjectsByOwner(user.id);
    
    const response: ProjectApiResponse = { success: true, projects };
    const validatedResponse = projectApiResponseSchema.parse(response);
    
    return c.json(validatedResponse, { status: 200 });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return c.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function handleUpdateProject(c: Context) {
  const user = await c.get("user");
  if (!user)
    return c.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const id = c.req.param("id");
  if (!id)
    return c.json(
      { success: false, error: "Project id is required" },
      { status: 400 },
    );

  const body = await c.req.json();
  const parsed = projectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const project = await getProjectById(id);
    if (!project)
      return c.json(
        { success: false, error: "Project not found" },
        { status: 404 },
      );
    if (project.ownerId !== user.id)
      return c.json({ success: false, error: "Forbidden" }, { status: 403 });

    const updated = await updateProject(id, parsed.data);
    return c.json({ success: true, project: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating project:", error);
    return c.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

