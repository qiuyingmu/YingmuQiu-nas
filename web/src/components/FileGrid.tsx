import { useCallback } from 'react'
import { Card, Modal, Input, message, Checkbox } from 'antd'
import {
  FileOutlined,
  FolderOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  AudioOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useFileStore } from '../stores/fileStore'
import type { FileItem } from '../api/files'

function getFileIcon(name: string, mimeType: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) {
    return <FileImageOutlined style={{ fontSize: 48, color: '#52c41a' }} />
  }
  if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'mkv', 'wmv'].includes(ext || '')) {
    return <VideoCameraOutlined style={{ fontSize: 48, color: '#722ed1' }} />
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac'].includes(ext || '')) {
    return <AudioOutlined style={{ fontSize: 48, color: '#eb2f96' }} />
  }
  if (['pdf'].includes(ext || '')) {
    return <FilePdfOutlined style={{ fontSize: 48, color: '#f5222d' }} />
  }
  if (['doc', 'docx'].includes(ext || '')) {
    return <FileWordOutlined style={{ fontSize: 48, color: '#1677ff' }} />
  }
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
    return <FileZipOutlined style={{ fontSize: 48, color: '#faad14' }} />
  }
  return <FileOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />
}

export default function FileGrid() {
  const navigate = useNavigate()
  const currentFiles = useFileStore((s) => s.currentFiles)
  const currentFolderId = useFileStore((s) => s.currentFolderId)
  const setCurrentFolderId = useFileStore((s) => s.setCurrentFolderId)
  const setCurrentPath = useFileStore((s) => s.setCurrentPath)
  const currentPath = useFileStore((s) => s.currentPath)
  const fetchFiles = useFileStore((s) => s.fetchFiles)
  const selectedFileIds = useFileStore((s) => s.selectedFileIds)
  const setSelectedFileIds = useFileStore((s) => s.setSelectedFileIds)

  const handleFileClick = useCallback(
    (record: FileItem) => {
      if (record.type === 'directory') {
        const newPath = [
          ...currentPath,
          {
            id: record.id,
            name: record.name,
            type: 'directory' as const,
            size: 0,
            mimeType: '',
            updatedAt: '',
            createdAt: '',
            parentId: currentFolderId,
          },
        ]
        setCurrentFolderId(record.id)
        setCurrentPath(newPath)
        fetchFiles(record.id)
        navigate(`/files/${record.id}`)
      }
    },
    [currentPath, currentFolderId, setCurrentFolderId, setCurrentPath, fetchFiles, navigate],
  )

  const handleSelect = (id: number) => {
    const newSelected = selectedFileIds.includes(id)
      ? selectedFileIds.filter((fid) => fid !== id)
      : [...selectedFileIds, id]
    setSelectedFileIds(newSelected)
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {currentFiles.map((file) => {
          const isSelected = selectedFileIds.includes(file.id)
          return (
            <Card
              key={file.id}
              size="small"
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleFileClick(file)}
              bodyStyle={{ padding: 16, textAlign: 'center' }}
            >
              <div className="relative">
                <div
                  className="absolute top-0 left-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(file.id)
                  }}
                >
                  <Checkbox checked={isSelected} />
                </div>
                <div className="flex flex-col items-center gap-2 py-2">
                  {file.type === 'directory' ? (
                    <FolderOutlined style={{ fontSize: 48, color: '#faad14' }} />
                  ) : (
                    getFileIcon(file.name, file.mimeType)
                  )}
                  <div className="text-xs truncate w-full text-center">
                    {file.name}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      {currentFiles.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-400">
          ??????
        </div>
      )}
    </div>
  )
}
