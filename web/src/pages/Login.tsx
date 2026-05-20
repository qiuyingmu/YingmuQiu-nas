import { useEffect } from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface LoginFormValues {
  username: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const loading = useAuthStore((s) => s.loading)

  const onFinish = async (values: LoginFormValues) => {
    try {
      await login(values)
      message.success('????')
      navigate('/files')
    } catch {
      message.error('????????')
    }
  }

  return (
    <div className="flex flex-col items-center">
      <img src="/logo.png" alt="YingmuQiu-nas" className="w-20 h-20 mb-4 rounded-2xl" />
      <h2 className="text-xl font-semibold text-center mb-6">??? YingmuQiu-nas</h2>
      <Form
        name="login"
        onFinish={onFinish}
        layout="vertical"
        size="large"
        autoComplete="off"
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: '??????' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="???"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '?????' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="??"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            ??
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center text-sm text-gray-500">
        ??????
        <Link to="/register" className="text-blue-500 hover:text-blue-600">
          ????
        </Link>
      </div>
    </div>
  )
}
