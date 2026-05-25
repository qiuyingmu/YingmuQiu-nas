import { useState, useEffect, useCallback, useRef } from 'react'
import { Tabs, Typography, Button, Table, Spin, Empty, message } from 'antd'
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  FileOutlined,
} from '@ant-design/icons'
import { mediaApi, type MediaItem } from '../api/media'
import { formatFileSize, formatDateTime } from '../utils/format'
import Thumbnail from '../components/Thumbnail'
import ImagePreview, { type PreviewItem } from '../components/ImagePreview'
import VideoPlayer from '../components/VideoPlayer'
import AudioPlayer from '../components/AudioPlayer'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

type MediaType = '' | 'image' | 'video' | 'audio' | 'document'

const TAB_MAP: Record<string, MediaType> = {
  all: '',
  image: 'image',
  video: 'video',
  audio: 'audio',
  document: 'document',
}

const TAB_ITEMS = [
  { key: 'all', label: '全部', icon: <AppstoreOutlined /> },
  { key: 'image', label: '图片', icon: <PictureOutlined /> },
  { key: 'video', label: '视频', icon: <PlayCircleOutlined /> },
  { key: 'audio', label: '音频', icon: <SoundOutlined /> },
  { key: 'document', label: '文档', icon: <FileOutlined /> },
]

const PAGE_SIZE = 50

export default function MediaLibrary() {
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [items, setItems] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalSize, setTotalSize] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const [audioOpen, setAudioOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoading(true)
      try {
        const mediaType = TAB_MAP[activeTab]
        const data = await mediaApi.getList({
          type: mediaType || undefined,
          page: pageNum,
          pageSize: PAGE_SIZE,
        })
        if (append) {
          setItems((prev) => [...prev, ...data.content])
        } else {
          setItems(data.content)
        }
        setTotal(data.totalElements)
        setHasMore((pageNum + 1) * PAGE_SIZE < data.totalElements)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    },
    [activeTab],
  )

  // Reset when tab changes
  useEffect(() => {
    setPage(1)
    setItems([])
    setHasMore(true)
    loadData(1, false)
  }, [activeTab, loadData])

  // Infinite scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      if (loading || !hasMore) return
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 200) {
        const nextPage = page + 1
        setPage(nextPage)
        loadData(nextPage, true)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [page, loading, hasMore, loadData])

  // Preview handlers
  const handleItemClick = async (item: MediaItem) => {
    if (item.mediaType === 'video') {
      setPreviewItem(item)
      setVideoOpen(true)
    } else if (item.mediaType === 'audio') {
      setPreviewItem(item)
      setAudioOpen(true)
    } else if (item.mediaType === 'image') {
      setPreviewItem(item)
    } else {
      // document - maybe download?
      try {
        const { downloadWithAuth } = await import('../api/authResource')
        await downloadWithAuth(`/files/${item.fileId}/download`, item.fileName || 'download')
      } catch {
        message.error('下载失败')
      }
    }
  }

  // Image preview items
  const imageItems: PreviewItem[] = items
    .filter((it) => it.mediaType === 'image')
    .map((it) => ({
      fileId: it.fileId,
      fileName: it.fileName,
      width: it.width,
      height: it.height,
      takenAt: it.takenAt,
    }))

  const imagePreviewIndex = previewItem
    ? imageItems.findIndex((it) => it.fileId === previewItem.fileId)
    : -1

  // Table columns for list view
  const columns: ColumnsType<MediaItem> = [
    {
      title: '名称',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (name: string, record: MediaItem) => (
        <span
          className="cursor-pointer hover:text-blue-500"
          onClick={() => handleItemClick(record)}
        >
          {name}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'mediaType',
      key: 'mediaType',
      width: 100,
      render: (type: string) => {
        const map: Record<string, string> = {
          image: '图片',
          video: '视频',
          audio: '音频',
          document: '文档',
        }
        return map[type] || type
      },
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 120,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '分辨率',
      key: 'resolution',
      width: 130,
      render: (_: unknown, record: MediaItem) =>
        record.width && record.height
          ? `${record.width} × ${record.height}`
          : '-',
    },
    {
      title: '时长',
      key: 'duration',
      width: 100,
      render: (_: unknown, record: MediaItem) =>
        record.durationMs
          ? `${Math.floor(record.durationMs / 60000)}:${Math.floor(
              (record.durationMs % 60000) / 1000,
            )
              .toString()
              .padStart(2, '0')}`
          : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => formatDateTime(date),
    },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-900">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <Text className="text-white text-lg font-medium">媒体库</Text>
          <div className="flex items-center gap-3">
            <Text className="text-gray-400 text-sm">
              共 {total} 个文件，{formatFileSize(totalSize)}
            </Text>
            <Button
              type={viewMode === 'grid' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              size="small"
              onClick={() => setViewMode('grid')}
            />
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              size="small"
              onClick={() => setViewMode('list')}
            />
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={TAB_ITEMS.map((t) => ({
            key: t.key,
            label: (
              <span className="text-gray-300">{t.label}</span>
            ),
          }))}
          className="!mb-0"
        />
      </div>

      {/* Content */}
      <div ref={containerRef} className="flex-1 overflow-auto">
        {viewMode === 'grid' ? (
          <div className="p-4">
            {items.length === 0 && !loading ? (
              <div className="flex items-center justify-center h-64">
                <Empty description={<span className="text-gray-400">暂无媒体文件</span>} />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {items.map((item) => (
                  <div
                    key={item.fileId}
                    className="relative group cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    {item.mediaType === 'video' && (
                      <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                        {item.durationMs
                          ? `${Math.floor(item.durationMs / 60000)}:${Math.floor(
                              (item.durationMs % 60000) / 1000,
                            )
                              .toString()
                              .padStart(2, '0')}`
                          : ''}
                      </div>
                    )}
                    <Thumbnail
                      fileId={item.fileId}
                      fileName={item.fileName}
                      mediaType={item.mediaType}
                      hasThumbnail={item.hasThumbnail}
                      size="medium"
                    />
                  </div>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-6">
                <Spin />
              </div>
            )}

            {!hasMore && items.length > 0 && (
              <div className="text-center text-gray-500 text-sm py-4">
                已加载全部 {total} 个文件
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="bg-white rounded-lg">
              <Table
                columns={columns}
                dataSource={items}
                rowKey="fileId"
                loading={loading}
                pagination={false}
                size="small"
                scroll={{ y: 'calc(100vh - 280px)' }}
                locale={{ emptyText: '暂无媒体文件' }}
                onRow={(record) => ({
                  onDoubleClick: () => handleItemClick(record),
                })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Image Preview */}
      {imagePreviewIndex >= 0 && (
        <ImagePreview
          open={true}
          items={imageItems}
          currentIndex={imagePreviewIndex}
          onClose={() => setPreviewItem(null)}
          onIndexChange={(idx) => {
            setPreviewItem(
              items.find((it) => it.fileId === imageItems[idx].fileId) || null,
            )
          }}
        />
      )}

      {/* Video Player */}
      {previewItem && previewItem.mediaType === 'video' && (
        <VideoPlayer
          open={videoOpen}
          fileId={previewItem.fileId}
          fileName={previewItem.fileName}
          onClose={() => {
            setVideoOpen(false)
            setPreviewItem(null)
          }}
        />
      )}

      {/* Audio Player */}
      {previewItem && previewItem.mediaType === 'audio' && (
        <AudioPlayer
          open={audioOpen}
          fileId={previewItem.fileId}
          fileName={previewItem.fileName}
          onClose={() => {
            setAudioOpen(false)
            setPreviewItem(null)
          }}
        />
      )}
    </div>
  )
}
