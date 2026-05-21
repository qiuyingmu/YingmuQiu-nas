import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'

const { Content } = Layout

export default function AuthLayout() {
  return (
    <Layout className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
    >
      {/* 装饰性背景圆 */}
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #1677ff, transparent)' }}
      />
      <div className="absolute bottom-[-80px] left-[-80px] w-[250px] h-[250px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #1677ff, transparent)' }}
      />

      <Content className="w-full max-w-md px-4 animate-fadeIn">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg mb-4">
            <img src="/logo.png" alt="YingmuQiu-nas" className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">个人云NAS</h1>
          <p className="text-blue-200/70">安全可靠的个人云存储服务</p>
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8
          transition-all duration-300 hover:shadow-blue-500/10">
          <Outlet />
        </div>
      </Content>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </Layout>
  )
}
