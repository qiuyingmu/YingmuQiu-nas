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
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useFileStore } from '../stores/fileStore'
import { formatFileSize, formatDateTime } from '../utils/format'
import type { FileItem } from '../api/files'
import { useState } from 'react'
import { getDownloadUrl } from '../api/files'

function getFileIcon(name: string, mimeType: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) {
    return <FileImageOutlined className="text-green-500 text-lg" />
  }
  if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'mkv', 'wmv'].includes(ext || '')) {
    return <VideoCameraOutlined className="text-purple-500 text-lg" />
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac'].includes(ext || '')) {
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

export default function FileList() {
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
      if (record.type === 'directory') {
        const newPath = [...currentPath, { id: record.id, name: record.name, type: 'directory' as const, size: 0, mimeType: '', updatedAt: '', createdAt: '', parentId: currentFolderId }]
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
      const url = await getDownloadUrl(record.id)
      window.open(url, '_blank')
    } catch {
      message.error('????')
    }
  }

  const handleDelete = (record: FileItem) => {
    Modal.confirm({
      title: '????',
      content: `?????"${record.name}"??`,
      okText: '??',
      okType: 'danger',
      cancelText: '??',
      onOk: async () => {
        try {
          await remove(record.id)
          message.success('????')
        } catch {
          message.error('????')
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
      message.success('?????')
      setRenameModalOpen(false)
    } catch {
      message.error('?????')
    }
  }

  const handleBatchDelete = () => {
    if (selectedFileIds.length === 0) return
    Modal.confirm({
      title: '????',
      content: `???????? ${selectedFileIds.length} ???/?????`,
      okText: '??',
      okType: 'danger',
      cancelText: '??',
      onOk: async () => {
        try {
          await batchRemove(selectedFileIds)
          setSelectedFileIds([])
          message.success('??????')
        } catch {
          message.error('??????')
        }
      },
    })
  }

  const rowSelection = {
    selectedRowKeys: selectedFileIds,
    onChange: (keys: React.Key[]) => setSelectedFileIds(keys as number[]),
  }

  const contextMenuItems = (record: FileItem) => [
    {
      key: 'download',
      label: '??',
      icon: <DownloadOutlined />,
      disabled: record.type === 'directory',
      onClick: () => handleDownload(record),
    },
    {
      key: 'rename',
      label: '???',
      icon: <EditOutlined />,
      onClick: () => handleRename(record),
    },
    {
      key: 'delete',
      label: '??',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(record),
    },
  ]

  const columns: ColumnsType<FileItem> = [
    {
      title: '??',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: FileItem) => (
        <span
          className="cursor-pointer hover:text-blue-500 flex items-center gap-2"
          onClick={() => handleRowClick(record)}
        >
          {record.type === 'directory' ? (
            <FolderOutlined className="text-yellow-500 text-lg" />
          ) : (
            getFileIcon(name, record.mimeType)
          )}
          <span>{name}</span>
        </span>
      ),
    },
    {
      title: '??',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number, record: FileItem) =>
        record.type === 'directory' ? '-' : formatFileSize(size),
    },
    {
      title: '??',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (type === 'directory' ? '???' : '??'),
    },
    {
      title: '????',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '??',
      key: 'actions',
      width: 160,
      render: (_: unknown, record: FileItem) => (
        <Space>
          {record.type === 'file' && (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleDownload(record)
              }}
            >
              ??
            </Button>
          )}
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
            ??
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
            ??? {selectedFileIds.length} ?
          </span>
          <Space>
            <Button size="small" onClick={() => setSelectedFileIds([])}>
              ????
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
            >
              ????
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
              emptyText: '??????',
            }}
            onRow={(record) => ({
              onDoubleClick: () => handleRowClick(record),
              onContextMenu: () => {},
            })}
          />
        </Dropdown>
      </div>

      <Modal
        title="???"
        open={renameModalOpen}
        onOk={confirmRename}
        onCancel={() => setRenameModalOpen(false)}
        okText="??"
        cancelText="??"
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
