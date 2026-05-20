import client from './client'

export interface FileItem {
  id: number
  name: string
  type: 'file' | 'directory'
  size: number
  mimeType: string
  updatedAt: string
  createdAt: string
  parentId: number | null
  children?: FileItem[]
}

export interface FileTreeItem {
  id: number
  name: string
  type: 'file' | 'directory'
  children?: FileTreeItem[]
}

export interface SearchResult {
  files: FileItem[]
  total: number
}

export async function getFiles(parentId?: number): Promise<FileItem[]> {
  const params = parentId !== undefined ? { parentId } : {}
  const response = await client.get<FileItem[]>('/files', { params })
  return response.data
}

export async function getFileTree(): Promise<FileTreeItem[]> {
  const response = await client.get<FileTreeItem[]>('/files/tree')
  return response.data
}

export async function searchFiles(query: string): Promise<SearchResult> {
  const response = await client.get<SearchResult>('/files/search', {
    params: { q: query },
  })
  return response.data
}

export async function createDirectory(
  name: string,
  parentId?: number,
): Promise<FileItem> {
  const response = await client.post<FileItem>('/files/directory', {
    name,
    parentId,
  })
  return response.data
}

export async function renameFile(
  id: number,
  name: string,
): Promise<FileItem> {
  const response = await client.put<FileItem>(`/files/${id}/rename`, { name })
  return response.data
}

export async function deleteFile(id: number): Promise<void> {
  await client.delete(`/files/${id}`)
}

export async function deleteFiles(ids: number[]): Promise<void> {
  await client.post('/files/batch-delete', { ids })
}

export async function uploadFile(
  file: File,
  parentId?: number,
  onProgress?: (percent: number) => void,
): Promise<FileItem> {
  const formData = new FormData()
  formData.append('file', file)
  if (parentId !== undefined) {
    formData.append('parentId', String(parentId))
  }

  const response = await client.post<FileItem>('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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

export async function getDownloadUrl(id: number): Promise<string> {
  return `${client.defaults.baseURL}/files/${id}/download`
}
