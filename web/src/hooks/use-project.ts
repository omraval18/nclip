import { fetchProject } from '@/lib/api/project'
import { useQuery } from '@tanstack/react-query'

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  })
}
