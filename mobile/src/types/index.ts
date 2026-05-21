// Shared types for mobile app

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  storageQuota: number
  storageUsed: number
}

export interface FileItem {
  id: string
  name: string
  isFolder: boolean
  mimeType?: string | null
  sizeBytes: number
  parentId?: string | null
  createdAt: string
  updatedAt: string
}

export interface MediaItem {
  id: string
  fileId: string
  fileName: string
  mediaType: 'image' | 'video' | 'audio' | 'document'
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  takenAt?: string
  hasThumbnail: boolean
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface LoginResult {
  token: string
  user: User
}

export interface PageData<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
