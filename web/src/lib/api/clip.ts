import { apiResponseSchema, type ClipResponse, type ClipsPageResponse } from "@/lib/schema/clips";
import { env } from "../env";

export type Clip = ClipResponse;
export type ClipsPage = ClipsPageResponse;

export async function fetchClipsPage(projectId: string, page = 1, perPage = 20): Promise<ClipsPage> {
  if (!projectId) throw new Error("projectId is required")
  const params = new URLSearchParams({
    page: String(page),
    limit: String(perPage),
  })
  const res = await fetch(`${env.VITE_BASE_API}/api/clips/${encodeURIComponent(projectId)}?${params.toString()}`, {
    method: "GET",
    credentials: "include",
    headers: { "Accept": "application/json" },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to fetch clips: ${res.status} ${text}`)
  }
  const body = await res.json()
  
  const validatedResponse = apiResponseSchema.parse(body);
  
  if (!validatedResponse.success || !validatedResponse.clips) {
    throw new Error(validatedResponse.error || "Invalid response")
  }
  
  return { 
    clips: validatedResponse.clips, 
    page, 
    perPage 
  }
}