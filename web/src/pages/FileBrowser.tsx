import { useEffect, useCallback, useState } from 'react'
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
import ImagePreview from '../components/ImagePreview'
import VideoPlayer from '../components/VideoPlayer'
import AudioPlayer from '../components/AudioPlayer'
import type { FileItem } from '../api/files'

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

  // Media preview state
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [imagePreviewIndex, setImagePreviewIndex] = useState(0)
  const [videoPreviewFile, setVideoPreviewFile] = useState<FileItem | null>(null)
  const [audioPreviewFile, setAudioPreviewFile] = useState<FileItem | null>(null)

  // Determine if a file is a media file and get its type
  const getMediaType = (file: FileItem): 'image' | 'video' | 'audio' | null => {
    const name = file.name.toLowerCase()
    if (file.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(name)) {
      return 'image'
    }
    if (file.mimeType?.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(name)) {
      return 'video'
    }
    if (file.mimeType?.startsWith('audio/') || /\.(mp3|wav|flac|aac|ogg)$/i.test(name)) {
      return 'audio'
    }
    return null
  }

  // Build image list for prev/next navigation
  const imageFiles = currentFiles.filter((f) => getMediaType(f) === 'image')

  const handleFileDoubleClick = useCallback(
    (file: FileItem) => {
      const type = getMediaType(file)
      if (type === 'image') {
        const idx = imageFiles.findIndex((f) => f.id === file.id)
        setImagePreviewIndex(idx >= 0 ? idx : 0)
        setImagePreviewOpen(true)
      } else if (type === 'video') {
        setVideoPreviewFile(file)
      } else if (type === 'audio') {
        setAudioPreviewFile(file)
      }
    },
    [imageFiles],
  )

  const loadFiles = useCallback(
    async (folderId?: string) => {
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
    const folderId = id || undefined

    if (folderId) {
      setCurrentFolderId(folderId)
    } else if (!id) {
      setCurrentFolderId(null)
      setCurrentPath([])
    }

    setSelectedFileIds([])
    loadFiles(folderId)
  }, [id, setCurrentFolderId, setCurrentPath, setSelectedFileIds, loadFiles])

  const handleRefresh = () => {
    const folderId = id || undefined
    loadFiles(folderId)
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
        {viewMode === 'list' ? (
          <FileList onFileDoubleClick={handleFileDoubleClick} />
        ) : (
          <FileGrid onFileDoubleClick={handleFileDoubleClick} />
        )}
      </div>

      <FileUploader
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
      />

      {/* Image Preview */}
      {imageFiles.length > 0 && (
        <ImagePreview
          open={imagePreviewOpen}
          items={imageFiles.map((f) => ({
            fileId: String(f.id),
            fileName: f.name,
          }))}
          currentIndex={imagePreviewIndex}
          onClose={() => setImagePreviewOpen(false)}
          onIndexChange={setImagePreviewIndex}
        />
      )}

      {/* Video Player */}
      {videoPreviewFile && (
        <VideoPlayer
          open={true}
          fileId={String(videoPreviewFile.id)}
          fileName={videoPreviewFile.name}
          onClose={() => setVideoPreviewFile(null)}
        />
      )}

      {/* Audio Player */}
      {audioPreviewFile && (
        <AudioPlayer
          open={true}
          fileId={String(audioPreviewFile.id)}
          fileName={audioPreviewFile.name}
          onClose={() => setAudioPreviewFile(null)}
        />
      )}
    </div>
  )
}
