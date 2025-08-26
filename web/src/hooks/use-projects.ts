import { useQuery } from "@tanstack/react-query";
import { fetchProjects, type ProjectsList } from "@/lib/api/project";

export function useProjects() {
    return useQuery<ProjectsList[], Error>({
        queryKey: ["projects"],
        queryFn: fetchProjects,
        staleTime: 1000 * 60 * 2,
        retry: 1,
        refetchOnWindowFocus: false,
    })
}