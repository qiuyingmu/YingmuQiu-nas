import client from './client'

export interface MediaItem {
  id: string
  fileId: string
  fileName: string
  mediaType: 'image' | 'video' | 'audio' | 'document'
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  durationMs?: number
  gpsLat?: number
  gpsLng?: number
  takenAt?: string
  createdAt: string
  hasThumbnail: boolean
}

export interface PageData<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const mediaApi = {
  getList: (params: { type?: string; page?: number; pageSize?: number }) =>
    client.get<PageData<MediaItem>>('/media', { params }).then(r => r.data),

  getTimeline: (params: { year?: number; month?: number; type?: string }) =>
    client.get<Record<string, MediaItem[]>>('/media/timeline', { params }).then(r => r.data),

  getDetail: (fileId: string) =>
    client.get<MediaItem>(`/media/${fileId}`).then(r => r.data),

  getThumbnailUrl: (fileId: string, size: 'small' | 'medium' = 'small') =>
    `/api/media/${fileId}/thumbnail?size=${size}`,

  getLocations: () =>
    client.get<MediaItem[]>('/media/locations').then(r => r.data),
}
