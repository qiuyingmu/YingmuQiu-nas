import client from './client'

export interface FileItem {
  id: string
  name: string
  isFolder: boolean
  mimeType?: string
  sizeBytes: number
  parentId?: string | null
  userId: string
  storagePath?: string
  createdAt: string
  updatedAt: string
}

export interface FileTreeItem {
  id: string
  name: string
  parentId: string | null
  isFolder: boolean
  children?: FileTreeItem[]
}

export async function getFiles(parentId?: string): Promise<FileItem[]> {
  const params: Record<string, unknown> = { pageSize: 0 }
  if (parentId) params.parentId = parentId
  const response = await client.get<FileItem[]>('/files', { params })
  return response.data
}

export async function getFileTree(): Promise<FileTreeItem[]> {
  const response = await client.get<FileTreeItem[]>('/files/tree')
  return response.data
}

export async function searchFiles(query: string): Promise<FileItem[]> {
  const response = await client.get<FileItem[]>('/files/search', {
    params: { q: query },
  })
  return response.data
}

export async function createFolder(
  name: string,
  parentId?: string,
): Promise<FileItem> {
  const response = await client.post<FileItem>('/files/folder', {
    name,
    parentId: parentId || null,
  })
  return response.data
}

export async function renameFile(
  id: string,
  name: string,
): Promise<FileItem> {
  const response = await client.put<FileItem>(`/files/${id}`, { name })
  return response.data
}

export async function deleteFiles(ids: string[]): Promise<void> {
  await client.delete('/files', { data: { ids } })
}

export async function uploadFile(
  file: File,
  parentId?: string,
  onProgress?: (percent: number) => void,
): Promise<FileItem> {
  const formData = new FormData()
  formData.append('file', file)
  if (parentId !== undefined) {
    formData.append('parentId', parentId)
  }

  const response = await client.post<FileItem>('/files/upload', formData, {
    timeout: 120000,
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        )
        onProgress(percent)
      }
    },
  })
  return response.data
}

export function getDownloadUrl(id: string): string {
  return `/files/${id}/download`
}
