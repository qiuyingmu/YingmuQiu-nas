import { create } from 'zustand'
import {
  getFiles,
  getFileTree,
  searchFiles,
  createDirectory,
  renameFile,
  deleteFile,
  deleteFiles,
  uploadFile,
  type FileItem,
  type FileTreeItem,
} from '../api/files'

interface FileState {
  currentFiles: FileItem[]
  fileTree: FileTreeItem[]
  currentFolderId: number | null
  currentPath: FileItem[]
  viewMode: 'list' | 'grid'
  searchQuery: string
  loading: boolean
  uploading: boolean
  uploadProgress: number
  selectedFileIds: number[]

  fetchFiles: (folderId?: number) => Promise<void>
  fetchFileTree: () => Promise<void>
  search: (query: string) => Promise<void>
  createFolder: (name: string, parentId?: number) => Promise<void>
  rename: (id: number, name: string) => Promise<void>
  remove: (id: number) => Promise<void>
  batchRemove: (ids: number[]) => Promise<void>
  upload: (file: File, parentId?: number) => Promise<void>
  setCurrentFolderId: (id: number | null) => void
  setCurrentPath: (path: FileItem[]) => void
  setViewMode: (mode: 'list' | 'grid') => void
  setSelectedFileIds: (ids: number[]) => void
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

  fetchFiles: async (folderId?: number) => {
    set({ loading: true })
    try {
      const files = await getFiles(folderId)
      set({ currentFiles: files, loading: false })
    } catch {
      set({ loading: false })
      throw new Error('????????')
    }
  },

  fetchFileTree: async () => {
    try {
      const tree = await getFileTree()
      set({ fileTree: tree })
    } catch {
      throw new Error('???????')
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
      set({ currentFiles: result.files, loading: false })
    } catch {
      set({ loading: false })
      throw new Error('????')
    }
  },

  createFolder: async (name: string, parentId?: number) => {
    await createDirectory(name, parentId)
    await get().fetchFiles(parentId ?? get().currentFolderId ?? undefined)
    await get().fetchFileTree()
  },

  rename: async (id: number, name: string) => {
    await renameFile(id, name)
    await get().fetchFiles(get().currentFolderId ?? undefined)
    await get().fetchFileTree()
  },

  remove: async (id: number) => {
    await deleteFile(id)
    await get().fetchFiles(get().currentFolderId ?? undefined)
    await get().fetchFileTree()
  },

  batchRemove: async (ids: number[]) => {
    await deleteFiles(ids)
    await get().fetchFiles(get().currentFolderId ?? undefined)
    await get().fetchFileTree()
  },

  upload: async (file: File, parentId?: number) => {
    set({ uploading: true, uploadProgress: 0 })
    try {
      await uploadFile(file, parentId ?? get().currentFolderId ?? undefined, (percent) => {
        set({ uploadProgress: percent })
      })
      set({ uploading: false, uploadProgress: 100 })
      await get().fetchFiles(get().currentFolderId ?? undefined)
    } catch {
      set({ uploading: false, uploadProgress: 0 })
      throw new Error('????')
    }
  },

  setCurrentFolderId: (id: number | null) => {
    set({ currentFolderId: id })
  },

  setCurrentPath: (path: FileItem[]) => {
    set({ currentPath: path })
  },

  setViewMode: (mode: 'list' | 'grid') => {
    set({ viewMode: mode })
  },

  setSelectedFileIds: (ids: number[]) => {
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
