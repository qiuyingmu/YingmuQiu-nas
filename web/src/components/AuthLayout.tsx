import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'

const { Content } = Layout

export default function AuthLayout() {
  return (
    <Layout className="min-h-screen flex items-center justify-center bg-gray-50">
      <Content className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">???NAS</h1>
          <p className="text-gray-500">????????????</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">
          <Outlet />
        </div>
      </Content>
    </Layout>
  )
}
