import { flattenClips, useClipsInfinite } from "@/hooks/use-clips"
import { VideoPlayer } from "./video-player"

export function ClipsGrid({ projectId }: { projectId: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useClipsInfinite(projectId, { perPage: 12 })

  if (status === 'pending') return <div>Loading clips...</div>
  if (status === 'error') return <div>Error loading clips: {(error as Error)?.message}</div>

  const clips = flattenClips(data)

  if (!clips.length) {
    return <div className="text-sm text-muted-foreground">No clips found yet.</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 px-8 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clips.map((clip) => (
          <div key={clip.id} className="rounded-2xl w-72 border border-muted bg-card">
            <VideoPlayer src={clip.url ?? ''} name={clip.name ?? clip.r2Key} />
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  )
}
