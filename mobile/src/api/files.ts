import client from './client'
import type { FileItem, PageData, MediaItem } from '../types'

// ---- File operations ----

export async function getFiles(parentId?: string): Promise<FileItem[]> {
  const params: Record<string, unknown> = { pageSize: 0 }
  if (parentId) params.parentId = parentId
  const response = await client.get<FileItem[]>('/files', { params })
  return response.data
}

export async function getFileTree(): Promise<FileItem[]> {
  const response = await client.get<FileItem[]>('/files/tree')
  return response.data
}

export async function createFolder(name: string, parentId?: string): Promise<FileItem> {
  const response = await client.post<FileItem>('/files/folder', {
    name,
    parentId: parentId || null,
  })
  return response.data
}

export async function renameFile(id: string, name: string): Promise<FileItem> {
  const response = await client.put<FileItem>(`/files/${id}`, { name })
  return response.data
}

export async function deleteFiles(ids: string[]): Promise<void> {
  await client.delete('/files', { data: { ids } })
}

export async function uploadFile(
  uri: string,
  fileName: string,
  mimeType: string,
  parentId?: string,
): Promise<FileItem> {
  const formData = new FormData()
  formData.append('file', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob)
  if (parentId) {
    formData.append('parentId', parentId)
  }
  const response = await client.post<FileItem>('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export function getDownloadUrl(id: string): string {
  return `/api/files/${id}/download`
}

export function getThumbnailUrl(fileId: string, size: 'small' | 'medium' = 'small'): string {
  return `/api/media/${fileId}/thumbnail?size=${size}`
}

// ---- Media operations ----

export async function getMediaList(type?: string): Promise<MediaItem[]> {
  const params: Record<string, unknown> = {}
  if (type) params.type = type
  const response = await client.get<PageData<MediaItem>>('/media', {
    params: { ...params, pageSize: 100 },
  })
  return response.data.content
}

export async function searchFiles(query: string): Promise<FileItem[]> {
  const response = await client.get<FileItem[]>('/files/search', {
    params: { q: query },
  })
  return response.data
}
