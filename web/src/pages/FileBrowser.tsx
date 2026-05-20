import { useEffect, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { Button, Space, message } from 'antd'
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useFileStore } from '../stores/fileStore'
import BreadcrumbNav from '../components/BreadcrumbNav'
import FileList from '../components/FileList'
import FileGrid from '../components/FileGrid'
import FileUploader from '../components/FileUploader'
import EmptyState from '../components/EmptyState'

interface OutletContext {
  uploadVisible: boolean
  setUploadVisible: (v: boolean) => void
}

export default function FileBrowser() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { uploadVisible, setUploadVisible } = useOutletContext<OutletContext>()

  const fetchFiles = useFileStore((s) => s.fetchFiles)
  const fetchFileTree = useFileStore((s) => s.fetchFileTree)
  const setCurrentFolderId = useFileStore((s) => s.setCurrentFolderId)
  const setCurrentPath = useFileStore((s) => s.setCurrentPath)
  const setSelectedFileIds = useFileStore((s) => s.setSelectedFileIds)
  const viewMode = useFileStore((s) => s.viewMode)
  const setViewMode = useFileStore((s) => s.setViewMode)
  const currentFiles = useFileStore((s) => s.currentFiles)
  const loading = useFileStore((s) => s.loading)
  const searchQuery = useFileStore((s) => s.searchQuery)

  const loadFiles = useCallback(
    async (folderId?: number) => {
      try {
        await fetchFiles(folderId)
        await fetchFileTree()
      } catch {
        message.error('????????')
      }
    },
    [fetchFiles, fetchFileTree],
  )

  useEffect(() => {
    const folderId = id ? Number(id) : undefined

    if (folderId && !isNaN(folderId)) {
      setCurrentFolderId(folderId)
    } else if (!id) {
      setCurrentFolderId(null)
      setCurrentPath([])
    }

    setSelectedFileIds([])
    loadFiles(folderId && !isNaN(folderId) ? folderId : undefined)
  }, [id, setCurrentFolderId, setCurrentPath, setSelectedFileIds, loadFiles])

  const handleRefresh = () => {
    const folderId = id ? Number(id) : undefined
    loadFiles(folderId && !isNaN(folderId) ? folderId : undefined)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <BreadcrumbNav />

      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
        <Space>
          <Button
            type={viewMode === 'list' ? 'primary' : 'default'}
            icon={<UnorderedListOutlined />}
            size="small"
            onClick={() => setViewMode('list')}
          />
          <Button
            type={viewMode === 'grid' ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            size="small"
            onClick={() => setViewMode('grid')}
          />
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={handleRefresh}
            loading={loading}
          />
        </Space>
        <span className="text-xs text-gray-400">
          {currentFiles.length > 0
            ? `? ${currentFiles.length} ?`
            : ''}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'list' ? <FileList /> : <FileGrid />}
      </div>

      <FileUploader
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
      />
    </div>
  )
}
