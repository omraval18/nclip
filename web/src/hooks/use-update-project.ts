import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProject, type ProjectUpdateInput, type Project } from "@/lib/api/project";

export function useUpdateProject() {
    const queryClient = useQueryClient();

    return useMutation<Project, Error, { projectId: string; data: ProjectUpdateInput }>({
        mutationFn: async ({ projectId, data }) => {
            return updateProject(projectId, data);
        },
        onSuccess: (updatedProject) => {
            queryClient.setQueryData(['project', updatedProject.id], updatedProject);
            
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error) => {
            console.error('Failed to update project:', error);
        }
    });
}