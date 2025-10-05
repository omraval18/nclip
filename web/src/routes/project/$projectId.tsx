import { ClipsGrid } from "@/components/clips-grid";
import Loader from "@/components/loader";
import { ProjectsList } from "@/components/projects-list";
import { StatusLoader } from "@/components/status-loader";
import { useProject } from "@/hooks/use-project";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/project/$projectId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    // const id = params.projectId
    // await fetch(`${env.VITE_BASE_API}/api/upload/status/revalidate/${id}`, {
    //   credentials: 'include',
    // })
  },
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const { data: project, isLoading, error } = useProject(projectId);

  if (isLoading)
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  if (error) return <div>Error: {(error as Error).message}</div>;
  if (!project) return <div>Project not found</div>;

  const status = project.uploadedFile?.status || "queued";

  return (
    <div className="w-full h-full p-8">
      {status === "completed" ? (
        <div className="w-full">
          <ClipsGrid projectId={projectId} />
        </div>
      ) : (
        <div className="w-full h-1/5 flex justify-center items-center">
          <StatusLoader status={status} />
        </div>
      )}
    </div>
  );
}
