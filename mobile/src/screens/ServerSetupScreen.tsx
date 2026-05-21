import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function ServerSetupScreen() {
  const { setServerUrl } = useAuth()
  const [url, setUrl] = useState('')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleTestConnection = async () => {
    if (!url.trim()) {
      Alert.alert('提示', '请输入服务器地址')
      return
    }
    setTesting(true)
    try {
      const normalized = url.trim().replace(/\/+$/, '')
      await client.get('/auth/login', { baseURL: normalized + '/api', timeout: 10000 })
      Alert.alert('连接成功', '服务器连接正常')
    } catch {
      Alert.alert('连接失败', '无法连接到服务器，请检查地址是否正确')
    } finally {
      setTesting(false)
    }
  }

  const handleConfirm = async () => {
    if (!url.trim()) {
      Alert.alert('提示', '请输入服务器地址')
      return
    }
    setSaving(true)
    try {
      await setServerUrl(url.trim())
    } catch {
      Alert.alert('错误', '保存服务器地址失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>📦</Text>
        <Text style={styles.title}>YingmuQiu-nas</Text>
        <Text style={styles.subtitle}>请输入服务器地址</Text>

        <TextInput
          style={styles.input}
          placeholder="http://192.168.1.100:8080"
          placeholderTextColor="#bbb"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="#1677ff" size="small" />
          ) : (
            <Text style={styles.testButtonText}>测试连接</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={handleConfirm}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmButtonText}>确认</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1677ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1677ff',
  },
  testButtonText: {
    color: '#1677ff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#1677ff',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
