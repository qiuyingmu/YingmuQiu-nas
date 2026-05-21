import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

import { AuthProvider, useAuth } from './src/context/AuthContext'
import ServerSetupScreen from './src/screens/ServerSetupScreen'
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import HomeScreen from './src/screens/HomeScreen'
import MediaScreen from './src/screens/MediaScreen'
import SettingsScreen from './src/screens/SettingsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function SplashScreen() {
  return (
    <View style={splashStyles.container}>
      <ActivityIndicator size="large" color="#1677ff" />
    </View>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1677ff',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          height: 55,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '文件',
          tabBarIcon: ({ color }) => (
            <View style={tabIconStyle}>
              <View style={[tabIconSquare, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Media"
        component={MediaScreen}
        options={{
          tabBarLabel: '媒体',
          tabBarIcon: ({ color }) => (
            <View style={tabIconStyle}>
              <View style={[tabIconCircle, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ color }) => (
            <View style={tabIconStyle}>
              <View style={[tabIconGear, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  )
}

function RootNavigator() {
  const { user, serverUrl, loading } = useAuth()

  if (loading) return <SplashScreen />

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!serverUrl ? (
        <Stack.Screen name="ServerSetup" component={ServerSetupScreen} />
      ) : user ? (
        <Stack.Screen name="Tabs" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  )
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
})

const tabIconStyle: { width: number; height: number; justifyContent: 'center'; alignItems: 'center' } = {
  width: 22,
  height: 22,
  justifyContent: 'center',
  alignItems: 'center',
}

const tabIconSquare = {
  width: 18,
  height: 18,
  borderRadius: 3,
}

const tabIconCircle = {
  width: 18,
  height: 18,
  borderRadius: 9,
}

const tabIconGear = {
  width: 18,
  height: 18,
  borderRadius: 3,
}
