import { useCallback } from 'react'
import { Table, Dropdown, Modal, Input, message, Button, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
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
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  ScissorOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useFileStore } from '../stores/fileStore'
import { formatFileSize, formatDateTime } from '../utils/format'
import type { FileItem } from '../api/files'
import { useState } from 'react'
import { getDownloadUrl } from '../api/files'
import { downloadWithAuth } from '../api/authResource'

function getFileIcon(name: string, mimeType?: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) {
    return <FileImageOutlined className="text-green-500 text-lg" />
  }
  if (mimeType?.startsWith('video/') || ['mp4', 'avi', 'mov', 'mkv', 'wmv'].includes(ext || '')) {
    return <VideoCameraOutlined className="text-purple-500 text-lg" />
  }
  if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac'].includes(ext || '')) {
    return <AudioOutlined className="text-pink-500 text-lg" />
  }
  if (['pdf'].includes(ext || '')) {
    return <FilePdfOutlined className="text-red-500 text-lg" />
  }
  if (['doc', 'docx'].includes(ext || '')) {
    return <FileWordOutlined className="text-blue-500 text-lg" />
  }
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return <FileExcelOutlined className="text-green-600 text-lg" />
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
    return <FileZipOutlined className="text-yellow-600 text-lg" />
  }
  return <FileOutlined className="text-gray-500 text-lg" />
}

export default function FileList({ onFileDoubleClick, onShare }: { onFileDoubleClick?: (file: FileItem) => void; onShare?: (file: FileItem) => void }) {
  const navigate = useNavigate()
  const currentFiles = useFileStore((s) => s.currentFiles)
  const currentFolderId = useFileStore((s) => s.currentFolderId)
  const setCurrentFolderId = useFileStore((s) => s.setCurrentFolderId)
  const setCurrentPath = useFileStore((s) => s.setCurrentPath)
  const currentPath = useFileStore((s) => s.currentPath)
  const fetchFiles = useFileStore((s) => s.fetchFiles)
  const remove = useFileStore((s) => s.remove)
  const rename = useFileStore((s) => s.rename)
  const selectedFileIds = useFileStore((s) => s.selectedFileIds)
  const setSelectedFileIds = useFileStore((s) => s.setSelectedFileIds)
  const batchRemove = useFileStore((s) => s.batchRemove)
  const loading = useFileStore((s) => s.loading)

  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null)

  const handleRowClick = useCallback(
    (record: FileItem) => {
      if (record.isFolder) {
        const newPath = [...currentPath, { id: record.id, name: record.name, isFolder: true, sizeBytes: 0, mimeType: '', updatedAt: '', createdAt: '', parentId: currentFolderId ?? undefined, userId: '' }]
        setCurrentFolderId(record.id)
        setCurrentPath(newPath)
        fetchFiles(record.id)
        navigate(`/files/${record.id}`)
      }
    },
    [currentPath, currentFolderId, setCurrentFolderId, setCurrentPath, fetchFiles, navigate],
  )

  const handleDownload = async (record: FileItem) => {
    try {
      await downloadWithAuth(`/files/${record.id}/download`, record.name)
    } catch {
      message.error('下载失败')
    }
  }

  const handleDelete = (record: FileItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除"${record.name}"吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await remove(record.id)
          message.success('删除成功')
        } catch {
          message.error('删除失败')
        }
      },
    })
  }

  const handleRename = (record: FileItem) => {
    setRenameTarget(record)
    setRenameValue(record.name)
    setRenameModalOpen(true)
  }

  const confirmRename = async () => {
    if (!renameValue.trim() || !renameTarget) return
    try {
      await rename(renameTarget.id, renameValue.trim())
      message.success('重命名成功')
      setRenameModalOpen(false)
    } catch {
      message.error('重命名失败')
    }
  }

  const handleBatchDelete = () => {
    if (selectedFileIds.length === 0) return
    Modal.confirm({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedFileIds.length} 个文件/文件夹吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await batchRemove(selectedFileIds)
          setSelectedFileIds([])
          message.success('批量删除成功')
        } catch {
          message.error('批量删除失败')
        }
      },
    })
  }

  const rowSelection = {
    selectedRowKeys: selectedFileIds,
    onChange: (keys: React.Key[]) => setSelectedFileIds(keys as string[]),
  }

  const contextMenuItems = (record: FileItem) => [
    {
      key: 'download',
      label: '下载',
      icon: <DownloadOutlined />,
      disabled: record.isFolder,
      onClick: () => handleDownload(record),
    },
    {
      key: 'share',
      label: '分享',
      icon: <ShareAltOutlined />,
      onClick: () => onShare?.(record),
    },
    {
      key: 'rename',
      label: '重命名',
      icon: <EditOutlined />,
      onClick: () => handleRename(record),
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(record),
    },
  ]

  const columns: ColumnsType<FileItem> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: FileItem) => (
        <span
          className="cursor-pointer hover:text-blue-500 flex items-center gap-2"
          onClick={() => handleRowClick(record)}
        >
          {record.isFolder ? (
            <FolderOutlined className="text-yellow-500 text-lg" />
          ) : (
            getFileIcon(name, record.mimeType)
          )}
          <span>{name}</span>
        </span>
      ),
    },
    {
      title: '大小',
      dataIndex: 'sizeBytes',
      key: 'sizeBytes',
      width: 120,
      render: (sizeBytes: number, record: FileItem) =>
        record.isFolder ? '-' : formatFileSize(sizeBytes),
    },
    {
      title: '类型',
      dataIndex: 'isFolder',
      key: 'isFolder',
      width: 100,
      render: (isFolder: boolean) => (isFolder ? '文件夹' : '文件'),
    },
    {
      title: '修改日期',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: FileItem) => (
        <Space>
          {!record.isFolder && (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleDownload(record)
              }}
            >
              下载
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<ShareAltOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              onShare?.(record)
            }}
          >
            分享
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(record)
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {selectedFileIds.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <span className="text-sm text-blue-600">
            已选择 {selectedFileIds.length} 项
          </span>
          <Space>
            <Button size="small" onClick={() => setSelectedFileIds([])}>
              取消选择
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
            >
              批量删除
            </Button>
          </Space>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <Dropdown
          menu={{ items: [] }}
          trigger={['contextMenu']}
        >
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={currentFiles}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
            scroll={{ y: 'calc(100vh - 280px)' }}
            locale={{
              emptyText: '此文件夹为空',
            }}
            onRow={(record) => ({
              onDoubleClick: () => {
                if (record.isFolder) {
                  handleRowClick(record)
                } else if (onFileDoubleClick) {
                  onFileDoubleClick(record)
                }
              },
              onContextMenu: () => {},
            })}
          />
        </Dropdown>
      </div>

      <Modal
        title="重命名"
        open={renameModalOpen}
        onOk={confirmRename}
        onCancel={() => setRenameModalOpen(false)}
        okText="确认"
        cancelText="取消"
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          autoFocus
          onPressEnter={confirmRename}
        />
      </Modal>
    </div>
  )
}
