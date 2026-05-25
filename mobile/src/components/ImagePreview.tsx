import React, { useEffect, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getBaseURL } from '../api/client'
import { getDownloadUrl } from '../api/files'

interface ImagePreviewProps {
  visible: boolean
  fileId: string
  fileName: string
  onClose: () => void
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function ImagePreview({ visible, fileId, fileName, onClose }: ImagePreviewProps) {
  const [imageUri, setImageUri] = useState('')

  useEffect(() => {
    if (!visible || !fileId) return
    AsyncStorage.getItem('nas_token').then((token) => {
      const base = getBaseURL() + getDownloadUrl(fileId)
      setImageUri(token ? `${base}?token=${token}` : base)
    })
  }, [visible, fileId])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>关闭</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="contain"
            transition={300}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  fileName: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
})
