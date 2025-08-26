import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query"
import { fetchClipsPage, type Clip } from "@/lib/api/clip"

export interface UseClipsOptions {
  perPage?: number
  enabled?: boolean
}

export interface ClipsPage {
  clips: Clip[]
  page: number
  perPage: number
  totalCount?: number
  hasMore?: boolean
}

export function useClipsInfinite(projectId: string, opts: UseClipsOptions = {}) {
  const perPage = opts.perPage ?? 20
  const enabled = Boolean(projectId) && (opts.enabled ?? true)

  return useInfiniteQuery<ClipsPage, Error, InfiniteData<ClipsPage, number>, (string | number)[], number>({
    queryKey: ["clips", projectId, perPage],
    queryFn: async ({ pageParam }) => {
      const page = pageParam ?? 1
      return fetchClipsPage(projectId, page, perPage)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (typeof lastPage.hasMore === "boolean") {
        return lastPage.hasMore ? lastPage.page + 1 : undefined
      }
      return lastPage.clips.length < lastPage.perPage ? undefined : lastPage.page + 1
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  })
}

export function flattenClips(pages: InfiniteData<ClipsPage, number> | undefined): Clip[] {
  if (!pages) return []
  return pages.pages.flatMap((p) => p.clips)
}
