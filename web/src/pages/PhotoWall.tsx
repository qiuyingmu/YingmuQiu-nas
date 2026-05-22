import { useState, useEffect, useCallback } from 'react'
import { Typography, Select, Collapse, Spin, Empty } from 'antd'
import {
  CalendarOutlined,
} from '@ant-design/icons'
import { mediaApi, type MediaItem } from '../api/media'
import Thumbnail from '../components/Thumbnail'
import ImagePreview, { type PreviewItem } from '../components/ImagePreview'

const { Text } = Typography

interface TimelineGroup {
  key: string
  year: number
  month: number
  items: MediaItem[]
}

export default function PhotoWall() {
  const [groups, setGroups] = useState<TimelineGroup[]>([])
  const [years, setYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)

  const loadTimeline = useCallback(async (year?: number) => {
    setLoading(true)
    try {
      const data = await mediaApi.getTimeline({
        type: 'image',
        year,
      })
      // Convert Record<string, MediaItem[]> to TimelineGroup[]
      const parsed: TimelineGroup[] = Object.entries(data).map(([key, items]) => {
        const [y, m] = key.split('-').map(Number)
        return { key, year: y, month: m, items }
      })
      parsed.sort((a, b) => b.key.localeCompare(a.key))
      setGroups(parsed)

      // Collect available years
      if (!year) {
        const yrSet = new Set(parsed.map((g) => g.year))
        setYears(Array.from(yrSet).sort((a, b) => b - a))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTimeline(selectedYear)
  }, [selectedYear, loadTimeline])

  const handleYearChange = (year: number | undefined) => {
    setSelectedYear(year || undefined)
  }

  // Image preview
  const allImages: PreviewItem[] = groups
    .flatMap((g) => g.items)
    .map((it) => ({
      fileId: it.fileId,
      fileName: it.fileName,
      width: it.width,
      height: it.height,
      takenAt: it.takenAt,
    }))

  const imagePreviewIndex = previewItem
    ? allImages.findIndex((it) => it.fileId === previewItem.fileId)
    : -1

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-blue-500 text-lg" />
          <Text className="text-lg font-medium">照片墙</Text>
          <Text className="text-gray-400 text-sm ml-2">
            {allImages.length > 0 ? `共 ${allImages.length} 张照片` : ''}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Text className="text-gray-400 text-sm">年份:</Text>
          <Select
            allowClear
            placeholder="选择年份"
            style={{ width: 120 }}
            value={selectedYear}
            onChange={handleYearChange}
            options={years.map((y) => ({ value: y, label: `${y}年` }))}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spin size="large" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Empty description={<span className="text-gray-400">暂无照片</span>} />
          </div>
        ) : (
          <div className="max-w-[1200px] mx-auto">
            {groups.map((group) => (
              <div key={`${group.year}-${group.month}`} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-blue-500 rounded" />
                  <Text className="text-lg font-medium">
                    {group.year}年{group.month}月
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    ({group.items.length} 张)
                  </Text>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {group.items.map((item) => (
                    <Thumbnail
                      key={item.fileId}
                      fileId={item.fileId}
                      fileName={item.fileName}
                      mediaType={item.mediaType}
                      hasThumbnail={item.hasThumbnail}
                      size="medium"
                      onClick={() => setPreviewItem(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview */}
      {imagePreviewIndex >= 0 && (
        <ImagePreview
          open={true}
          items={allImages}
          currentIndex={imagePreviewIndex}
          onClose={() => setPreviewItem(null)}
          onIndexChange={(idx: number) => {
            const matched = groups
              .flatMap((g) => g.items)
              .find((it) => it.fileId === allImages[idx].fileId)
            if (matched) setPreviewItem(matched)
          }}
        />
      )}
    </div>
  )
}
