import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MediaItem } from '../types'
import { getMediaList } from '../api/files'
import { getBaseURL } from '../api/client'
import { getThumbnailUrl } from '../api/files'
import ImagePreview from '../components/ImagePreview'

type TabType = 'all' | 'image' | 'video'

const TAB_MAP: { key: TabType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'video', label: '视频' },
]

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const NUM_COLUMNS = 3
const ITEM_MARGIN = 2
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS

export default function MediaScreen() {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const typeParam = activeTab === 'all' ? undefined : activeTab
      const data = await getMediaList(typeParam)
      setMediaList(data)
    } catch {
      setMediaList([])
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  const renderGridItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => setPreviewItem(item)}
      activeOpacity={0.7}
    >
      {item.hasThumbnail ? (
        <Image
          source={{ uri: getBaseURL() + getThumbnailUrl(item.fileId, 'medium') }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>
            {item.mediaType === 'video' ? '🎬' : '🖼️'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>媒体</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TAB_MAP.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1677ff" />
        </View>
      ) : (
        <FlatList
          data={mediaList}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={mediaList.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Text style={styles.emptyText}>暂无媒体文件</Text>
            </View>
          }
        />
      )}

      {/* Image Preview Modal */}
      {previewItem && (
        <ImagePreview
          visible={!!previewItem}
          fileId={previewItem.fileId}
          fileName={previewItem.fileName}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#1677ff',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: ITEM_MARGIN,
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  placeholderIcon: {
    fontSize: 28,
  },
})
