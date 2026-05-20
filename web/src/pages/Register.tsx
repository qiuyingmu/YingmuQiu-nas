import { Form, Input, Button, message } from 'antd'
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface RegisterFormValues {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export default function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const loading = useAuthStore((s) => s.loading)

  const onFinish = async (values: RegisterFormValues) => {
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
      })
      message.success('????,???')
      navigate('/login')
    } catch {
      message.error('????,???')
    }
  }

  return (
    <div className="flex flex-col items-center">
      <img src="/logo.png" alt="YingmuQiu-nas" className="w-20 h-20 mb-4 rounded-2xl" />
      <h2 className="text-xl font-semibold text-center mb-6">?? YingmuQiu-nas ??</h2>
      <Form
        name="register"
        onFinish={onFinish}
        layout="vertical"
        size="large"
        autoComplete="off"
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: '??????' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="???" />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: '?????' },
            { type: 'email', message: '??????????' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="??" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '?????' },
            { min: 6, message: '????6???' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="??" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '?????' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('??????????'))
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="????" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            ??
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center text-sm text-gray-500">
        ?????
        <Link to="/login" className="text-blue-500 hover:text-blue-600">
          ????
        </Link>
      </div>
    </div>
  )
}
