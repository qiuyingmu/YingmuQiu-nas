import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Dropdown, Avatar, Button, Space, Typography } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  UploadOutlined,
  FolderOutlined,
  PictureOutlined,
  PlaySquareOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'
import FileTree from './FileTree'
import SearchBar from './SearchBar'

const { Header, Sider, Content, Footer } = Layout
const { Text } = Typography

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const [uploadVisible, setUploadVisible] = useState(false)

  // Sidebar nav items
  const navItems = [
    {
      key: '/files',
      icon: <FolderOutlined />,
      label: '文件管理',
    },
    {
      key: '/photos',
      icon: <PictureOutlined />,
      label: '照片墙',
    },
    {
      key: '/media',
      icon: <PlaySquareOutlined />,
      label: '媒体库',
    },
  ]

  const currentNavKey = '/' + location.pathname.split('/')[1]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'user-info',
      label: (
        <div className="px-2 py-1">
          <div className="font-medium">{user?.username}</div>
          <div className="text-xs text-gray-400">{user?.email}</div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout className="h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        className="border-r border-gray-200"
        style={{ background: '#fff', overflow: 'auto' }}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200 gap-2">
          <img src="/logo.png" alt="YingmuQiu-nas" className="w-8 h-8 rounded-lg" />
          {!collapsed && (
            <Text strong className="text-lg">
              YingmuQiu-nas
            </Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[currentNavKey]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          className="border-r-0"
        />

        <div className="p-2">
          <FileTree />
        </div>
      </Sider>

      <Layout>
        <Header
          className="flex items-center justify-between px-4 bg-white border-b border-gray-200"
          style={{ height: 64, padding: '0 16px' }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <div className="w-80">
              <SearchBar />
            </div>
          </Space>

          <Space>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadVisible(true)}
            >
              上传
            </Button>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                icon={<UserOutlined />}
                className="cursor-pointer bg-blue-500"
              />
            </Dropdown>
          </Space>
        </Header>

        <Content className="flex flex-col overflow-hidden bg-gray-50">
          <Outlet context={{ uploadVisible, setUploadVisible }} />
        </Content>

        <Footer className="text-center text-gray-400 text-xs py-2 bg-white border-t border-gray-200">
          YingmuQiu-nas v1.0
        </Footer>
      </Layout>
    </Layout>
  )
}
