import React, { useState } from 'react'
import { Shield, AlertTriangle, Lock } from 'lucide-react'

const ADMIN_PASSWORD = 'HGI2028'

export default function AdminAuth({ onAuthenticated, onBack }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (password === ADMIN_PASSWORD) {
      onAuthenticated()
    } else {
      setError('Incorrect password. Access denied.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ironwood via-gray-800 to-ironwood flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="text-sulphur hover:text-yellow-400 transition-colors mb-6"
        >
          ← Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-red-600">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
              🔐
            </div>
            <h2 className="text-3xl font-serif font-bold mb-2">
              Restricted Access
            </h2>
            <p className="text-sm opacity-90">
              Administrator Authentication Required
            </p>
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-50 border-b-4 border-yellow-500 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
              <div className="text-sm text-yellow-800">
                <strong>AUTHORIZED PERSONNEL ONLY</strong>
                <p className="mt-1">
                  This portal is restricted to election officials and authorized administrators.
                  Unauthorized access attempts are logged and may be subject to investigation.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-bold text-ironwood mb-2">
                Administrator Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-md focus:border-red-600 focus:outline-none text-lg"
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Shield size={20} />
              Authenticate
            </button>
          </form>

          {/* Security Notice */}
          <div className="bg-gray-100 px-8 py-4 border-t-2 border-gray-300">
            <p className="text-xs text-gray-600 text-center">
              🔒 This is a secure administrative portal. All access attempts are logged
              and monitored for security purposes.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4 border-2 border-gray-300">
          <h4 className="font-bold text-ironwood mb-2 text-sm">Administrator Capabilities</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Configure teams and voting criteria</li>
            <li>• Manage voter registration</li>
            <li>• Monitor real-time voting activity</li>
            <li>• View and export results</li>
            <li>• Lock/unlock voting rounds</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
