import { useProjects } from "@/hooks/use-projects";
import type { Project, ProjectsList } from "@/lib/api/project";
import { PlusIcon, VideoCameraIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return diffInSeconds <= 1 ? "just now" : `${diffInSeconds} seconds ago`;
  } else if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  } else if (diffInDays < 30) {
    return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
  } else if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  } else {
    return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
  }
}

function ProjectRow({ project }: { project: ProjectsList }) {
  return (
    <TableRow className="cursor-pointer hover:bg-muted/50">
      <TableCell>
        <Link 
          to={"/project/$projectId"} 
          params={{ projectId: project.id }}
          className="flex items-center gap-3 text-inherit no-underline"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <VideoCameraIcon className="size-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">{project.name}</div>
            <span className="text-muted-foreground mt-0.5 text-xs">
              ID: {project.id.slice(0, 8)}...
            </span>
          </div>
        </Link>
      </TableCell>
      <TableCell>
        <div className="max-w-xs">
          {project.description ? (
            <span className="text-sm">{project.description}</span>
          ) : (
            <span className="text-muted-foreground text-sm italic">No description</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatRelativeTime(project.createdAt)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatRelativeTime(project.updatedAt)}
      </TableCell>
    </TableRow>
  );
}

export function ProjectsList() {
  const { data: projects, isLoading, error } = useProjects();
  
  if (error) {
    toast.error("Failed to Load your Projects");
  }

  return (
    <div className="p-8 mt-8">
      

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <VideoCameraIcon className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first project</p>
          <Button className="flex items-center gap-2">
            <PlusIcon className="size-4" />
            Create Project
          </Button>
        </div>
      )}
    </div>
  );
}