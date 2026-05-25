import { useState, useEffect, useCallback } from 'react'
import { Typography, Select, Empty, Spin } from 'antd'
import {
  CalendarOutlined,
} from '@ant-design/icons'
import { mediaApi, type MediaItem } from '../api/media'
import ImagePreview, { type PreviewItem } from '../components/ImagePreview'
import { getAuthToken } from '../api/authResource'

const { Text } = Typography

interface TimelineGroup {
  key: string
  year: number
  month: number
  items: MediaItem[]
}

// 判断文件名是否为常见图片格式
const isImageByName = (name: string) => /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(name)

export default function PhotoWall() {
  const [groups, setGroups] = useState<TimelineGroup[]>([])
  const [years, setYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const authToken = getAuthToken()

  const loadTimeline = useCallback(async (year?: number) => {
    setLoading(true)
    try {
      const data = await mediaApi.getTimeline({
        type: 'image',
        year,
      })
      const parsed: TimelineGroup[] = Object.entries(data).map(([key, items]) => {
        const [y, m] = key.split('-').map(Number)
        return { key, year: y, month: m, items }
      })
      parsed.sort((a, b) => b.key.localeCompare(a.key))
      setGroups(parsed)

      if (!year) {
        const yrSet = new Set(parsed.map((g) => g.year))
        setYears(Array.from(yrSet).sort((a, b) => b - a))
      }
    } catch (e) {
      console.error('Failed to load timeline', e)
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
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <CalendarOutlined className="text-blue-500 text-xl" />
          <Text className="text-lg font-semibold">照片墙</Text>
          <Text className="text-gray-400 text-sm">
            {allImages.length > 0 ? `共 ${allImages.length} 张照片` : ''}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Text className="text-gray-400 text-sm">年份:</Text>
          <Select
            allowClear
            placeholder="全部"
            style={{ width: 120 }}
            value={selectedYear}
            onChange={handleYearChange}
            options={years.map((y) => ({ value: y, label: `${y}年` }))}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spin size="large" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Empty description={<span className="text-gray-400">暂无照片，上传图片后会自动显示在这里</span>} />
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto">
            {groups.map((group) => (
              <div key={`${group.year}-${group.month}`} className="mb-10">
                {/* 时间标题 */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
                  <Text className="text-xl font-bold text-gray-800">
                    {group.year} 年 {group.month} 月
                  </Text>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                    {group.items.length} 张
                  </span>
                </div>

                {/* 瀑布流画廊 */}
                <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-3 space-y-3">
                  {group.items.map((item) => (
                    <div
                      key={item.fileId}
                      className="break-inside-avoid group cursor-pointer relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      onClick={() => setPreviewItem(item)}
                    >
                      {/* 图片容器 */}
                      <div className="relative w-full overflow-hidden bg-gray-100">
                        {item.hasThumbnail ? (
                          <img
                            src={`/api/media/${item.fileId}/thumbnail?size=medium&t=${Date.now()}&token=${authToken}`}
                            alt={item.fileName}
                            className={`w-full h-auto object-cover transition-all duration-500 group-hover:scale-105 ${
                              loadedImages.has(item.fileId) ? 'opacity-100' : 'opacity-0'
                            }`}
                            loading="lazy"
                            onLoad={() => setLoadedImages((prev) => new Set(prev).add(item.fileId))}
                            onError={(e) => {
                              // Fallback: try direct download
                              const el = e.currentTarget
                              if (!el.dataset.fallback) {
                                el.dataset.fallback = '1'
                                el.src = `/api/files/${item.fileId}/download?token=${authToken}`
                              } else {
                                el.style.display = 'none'
                                el.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'h-32')
                                el.parentElement!.innerHTML = `<span class="text-gray-300 text-3xl">📷</span>`
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-32 bg-gray-50">
                            {isImageByName(item.fileName) ? (
                              <img
                                src={`/api/files/${item.fileId}/download?token=${authToken}`}
                                alt={item.fileName}
                                className="w-full h-auto object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.parentElement!.innerHTML = `<span class="text-gray-300 text-3xl">📷</span>`
                                }}
                              />
                            ) : (
                              <span className="text-gray-300 text-3xl">📷</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 图片信息浮层 */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="p-3 pt-8">
                          <p className="text-white text-xs font-medium truncate">
                            {item.fileName}
                          </p>
                          {(item.width && item.height) && (
                            <p className="text-gray-300 text-xs mt-0.5">
                              {item.width} × {item.height}
                            </p>
                          )}
                          {item.takenAt && (
                            <p className="text-gray-300 text-xs mt-0.5">
                              {new Date(item.takenAt).toLocaleDateString('zh-CN')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
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
