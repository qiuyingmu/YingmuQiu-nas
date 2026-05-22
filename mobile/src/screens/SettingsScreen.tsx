import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { user, serverUrl, setServerUrl, logout } = useAuth()
  const [serverModalVisible, setServerModalVisible] = useState(false)
  const [newServerUrl, setNewServerUrl] = useState(serverUrl)

  const handleChangeServerUrl = async () => {
    if (!newServerUrl.trim()) {
      Alert.alert('提示', '请输入服务器地址')
      return
    }
    try {
      await setServerUrl(newServerUrl.trim())
      setServerModalVisible(false)
      Alert.alert('成功', '服务器地址已更新')
    } catch (e: unknown) {
      Alert.alert('失败', e instanceof Error ? e.message : '保存服务器地址失败')
    }
  }

  const handleOpenServerModal = () => {
    setNewServerUrl(serverUrl)
    setServerModalVisible(true)
  }

  const handleLogout = () => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout()
          } catch {
            // ignore
          }
        },
      },
    ])
  }

  const storageUsedPercent = user
    ? Math.min((user.storageUsed / user.storageQuota) * 100, 100)
    : 0
  const storageUsedText = user
    ? `${(user.storageUsed / 1024 / 1024 / 1024).toFixed(1)} GB / ${(user.storageQuota / 1024 / 1024 / 1024).toFixed(1)} GB`
    : ''

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>设置</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>用户信息</Text>
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.username || '未知用户'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
            </View>
          </View>
          {user && (
            <View style={styles.storageCard}>
              <Text style={styles.storageLabel}>存储空间</Text>
              <Text style={styles.storageText}>{storageUsedText}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${storageUsedPercent}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* Server */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>服务器</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleOpenServerModal}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuLabel}>服务器地址</Text>
              <Text style={styles.menuValue} numberOfLines={1}>
                {serverUrl}
              </Text>
            </View>
            <Text style={styles.menuArrow}>修改</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuLabel}>应用名称</Text>
              <Text style={styles.menuValue}>YingmuQiu-nas</Text>
            </View>
          </View>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Text style={styles.menuLabel}>版本</Text>
              <Text style={styles.menuValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Server URL Modal */}
      <Modal visible={serverModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>修改服务器地址</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="http://192.168.1.100:8080"
              placeholderTextColor="#bbb"
              value={newServerUrl}
              onChangeText={setNewServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setServerModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleChangeServerUrl}>
                <Text style={styles.modalConfirmText}>保存</Text>
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
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    paddingLeft: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1677ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
  },
  storageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  storageLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  storageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1677ff',
    borderRadius: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  menuLeft: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  menuValue: {
    fontSize: 13,
    color: '#999',
  },
  menuArrow: {
    fontSize: 13,
    color: '#1677ff',
    fontWeight: '500',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 30,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4d4f',
  },
  logoutText: {
    color: '#ff4d4f',
    fontSize: 16,
    fontWeight: '600',
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
