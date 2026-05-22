import { create } from 'zustand'
import {
  getFiles,
  getFileTree,
  searchFiles,
  createFolder,
  renameFile,
  deleteFiles,
  uploadFile,
  type FileItem,
  type FileTreeItem,
} from '../api/files'

interface FileState {
  currentFiles: FileItem[]
  fileTree: FileTreeItem[]
  currentFolderId: string | null
  currentPath: FileItem[]
  viewMode: 'list' | 'grid'
  searchQuery: string
  loading: boolean
  uploading: boolean
  uploadProgress: number
  selectedFileIds: string[]

  fetchFiles: (folderId?: string) => Promise<void>
  fetchFileTree: () => Promise<void>
  search: (query: string) => Promise<void>
  createFolder: (name: string, parentId?: string) => Promise<void>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  batchRemove: (ids: string[]) => Promise<void>
  upload: (file: File, parentId?: string) => Promise<void>
  setCurrentFolderId: (id: string | null) => void
  setCurrentPath: (path: FileItem[]) => void
  setViewMode: (mode: 'list' | 'grid') => void
  setSelectedFileIds: (ids: string[]) => void
  setSearchQuery: (query: string) => void
  clearSearch: () => Promise<void>
}

export const useFileStore = create<FileState>()((set, get) => ({
  currentFiles: [],
  fileTree: [],
  currentFolderId: null,
  currentPath: [],
  viewMode: 'list',
  searchQuery: '',
  loading: false,
  uploading: false,
  uploadProgress: 0,
  selectedFileIds: [],

  fetchFiles: async (folderId?: string) => {
    set({ loading: true })
    try {
      const files = await getFiles(folderId)
      set({ currentFiles: files, loading: false })
    } catch {
      set({ loading: false })
      throw new Error('获取文件列表失败')
    }
  },

  fetchFileTree: async () => {
    try {
      const tree = await getFileTree()
      set({ fileTree: tree })
    } catch {
      throw new Error('获取文件树失败')
    }
  },

  search: async (query: string) => {
    if (!query.trim()) {
      await get().fetchFiles(get().currentFolderId ?? undefined)
      return
    }
    set({ loading: true, searchQuery: query })
    try {
      const result = await searchFiles(query)
      set({ currentFiles: result, loading: false })
    } catch {
      set({ loading: false })
      throw new Error('搜索失败')
    }
  },

  createFolder: async (name: string, parentId?: string) => {
    await createFolder(name, parentId)
    await get().fetchFiles(parentId ?? get().currentFolderId ?? undefined)
    await get().fetchFileTree()
  },

  rename: async (id: string, name: string) => {
    await renameFile(id, name)
    await get().fetchFiles(get().currentFolderId ?? undefined)
    await get().fetchFileTree()
  },

  remove: async (id: string) => {
    await deleteFiles([id])
    await get().fetchFiles(get().currentFolderId ?? undefined)
    await get().fetchFileTree()
  },

  batchRemove: async (ids: string[]) => {
    await deleteFiles(ids)
    await get().fetchFiles(get().currentFolderId ?? undefined)
    await get().fetchFileTree()
  },

  upload: async (file: File, parentId?: string) => {
    set({ uploading: true, uploadProgress: 0 })
    try {
      await uploadFile(file, parentId ?? get().currentFolderId ?? undefined, (percent) => {
        set({ uploadProgress: percent })
      })
      set({ uploading: false, uploadProgress: 100 })
      await get().fetchFiles(get().currentFolderId ?? undefined)
    } catch {
      set({ uploading: false, uploadProgress: 0 })
      throw new Error('上传失败')
    }
  },

  setCurrentFolderId: (id: string | null) => {
    set({ currentFolderId: id })
  },

  setCurrentPath: (path: FileItem[]) => {
    set({ currentPath: path })
  },

  setViewMode: (mode: 'list' | 'grid') => {
    set({ viewMode: mode })
  },

  setSelectedFileIds: (ids: string[]) => {
    set({ selectedFileIds: ids })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  clearSearch: async () => {
    set({ searchQuery: '' })
    await get().fetchFiles(get().currentFolderId ?? undefined)
  },
}))
