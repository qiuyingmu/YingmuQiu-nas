import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { FileItem } from '../types'
import { getFiles, createFolder, deleteFiles, uploadFile } from '../api/files'
import FileListItem from '../components/FileListItem'
import { formatFileSize } from '../utils/format'

interface Breadcrumb {
  id?: string
  name: string
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const [files, setFiles] = useState<FileItem[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: undefined, name: '根目录' }])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [folderModalVisible, setFolderModalVisible] = useState(false)
  const [folderName, setFolderName] = useState('')

  const currentParentId = breadcrumbs[breadcrumbs.length - 1]?.id

  const fetchFiles = useCallback(async () => {
    try {
      const data = await getFiles(currentParentId)
      setFiles(data)
    } catch (e: unknown) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '无法获取文件列表')
    }
  }, [currentParentId])

  useEffect(() => {
    setLoading(true)
    fetchFiles().finally(() => setLoading(false))
  }, [fetchFiles])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchFiles()
    setRefreshing(false)
  }

  const enterFolder = (folder: FileItem) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])
  }

  const goToBreadcrumb = (index: number) => {
    setBreadcrumbs((prev) => prev.slice(0, index + 1))
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      Alert.alert('提示', '请输入文件夹名称')
      return
    }
    try {
      await createFolder(folderName.trim(), currentParentId)
      setFolderModalVisible(false)
      setFolderName('')
      await fetchFiles()
    } catch (e: unknown) {
      Alert.alert('创建失败', e instanceof Error ? e.message : '无法创建文件夹')
    }
  }

  const handleDeleteFile = (item: FileItem) => {
    Alert.alert('确认删除', `确定要删除「${item.name}」吗？文件将被移入回收站。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFiles([item.id])
            await fetchFiles()
          } catch (e: unknown) {
            Alert.alert('删除失败', e instanceof Error ? e.message : '无法删除文件')
          }
        },
      },
    ])
  }

  const handlePickAndUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    })
    if (result.canceled || !result.assets?.length) return

    setUploading(true)
    try {
      const asset = result.assets[0]
      const fileName = asset.fileName || asset.uri.split('/').pop() || 'untitled'
      const mimeType = asset.mimeType || 'application/octet-stream'
      await uploadFile(asset.uri, fileName, mimeType, currentParentId)
      await fetchFiles()
    } catch (e: unknown) {
      Alert.alert('上传失败', e instanceof Error ? e.message : '文件上传出错')
    } finally {
      setUploading(false)
    }
  }

  const renderItem = ({ item }: { item: FileItem }) => (
    <FileListItem
      item={item}
      onPress={() => {
        if (item.isFolder) {
          enterFolder(item)
        }
      }}
      onLongPress={() => handleDeleteFile(item)}
    />
  )

  const totalSize = files.reduce((sum, f) => sum + (f.isFolder ? 0 : f.sizeBytes), 0)

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1677ff" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>文件</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setFolderModalVisible(true)}
        >
          <Text style={styles.headerButtonText}>+ 新建文件夹</Text>
        </TouchableOpacity>
      </View>

      {/* Breadcrumb */}
      <View style={styles.breadcrumbContainer}>
        {breadcrumbs.map((crumb, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goToBreadcrumb(index)}
            style={styles.breadcrumbItem}
          >
            <Text
              style={[
                styles.breadcrumbText,
                index === breadcrumbs.length - 1 && styles.breadcrumbActive,
              ]}
              numberOfLines={1}
            >
              {crumb.name}
            </Text>
            {index < breadcrumbs.length - 1 && (
              <Text style={styles.breadcrumbSeparator}> / </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* File List */}
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={files.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Text style={styles.emptyText}>暂无文件</Text>
            <Text style={styles.emptySubText}>点击右下角 + 上传文件</Text>
          </View>
        }
      />

      {/* Status bar */}
      {files.length > 0 && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {files.length} 个文件 · {formatFileSize(totalSize)}
          </Text>
        </View>
      )}

      {/* Upload FAB */}
      <TouchableOpacity
        style={[styles.fab, uploading && styles.fabUploading]}
        onPress={handlePickAndUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.fabText}>+</Text>
        )}
      </TouchableOpacity>

      {/* Create Folder Modal */}
      <Modal visible={folderModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建文件夹</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="文件夹名称"
              placeholderTextColor="#bbb"
              value={folderName}
              onChangeText={setFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setFolderModalVisible(false)
                  setFolderName('')
                }}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleCreateFolder}>
                <Text style={styles.modalConfirmText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f4ff',
  },
  headerButtonText: {
    fontSize: 13,
    color: '#1677ff',
    fontWeight: '600',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: 13,
    color: '#666',
    maxWidth: 100,
  },
  breadcrumbActive: {
    color: '#1677ff',
    fontWeight: '600',
  },
  breadcrumbSeparator: {
    fontSize: 13,
    color: '#ccc',
    marginHorizontal: 2,
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
    fontSize: 16,
    color: '#999',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 13,
    color: '#bbb',
  },
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1677ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabUploading: {
    backgroundColor: '#999',
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    height: 44,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 15,
  },
  modalConfirmButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#1677ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
})
