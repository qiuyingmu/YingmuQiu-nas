import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { FileItem } from '../types'
import { formatFileSize, formatDate, getFileIcon } from '../utils/format'
import { getBaseURL } from '../api/client'
import { getThumbnailUrl } from '../api/files'

interface FileListItemProps {
  item: FileItem
  onPress?: () => void
  onLongPress?: () => void
}

export default function FileListItem({ item, onPress, onLongPress }: FileListItemProps) {
  const iconType = getFileIcon(item.name)
  const isImage = iconType === 'image'

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.6}
    >
      <View style={styles.iconContainer}>
        {item.isFolder ? (
          <Text style={styles.iconText}>📁</Text>
        ) : isImage ? (
          <Image
            source={{ uri: getBaseURL() + getThumbnailUrl(item.id, 'small') }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Text style={styles.iconText}>📄</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {!item.isFolder && (
          <Text style={styles.meta}>
            {formatFileSize(item.sizeBytes)} · {formatDate(item.createdAt)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  iconText: {
    fontSize: 22,
  },
  thumbnail: {
    width: 40,
    height: 40,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  meta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
})
