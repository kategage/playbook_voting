import React, { useState, useEffect } from 'react'
import VoterPortal from './components/VoterPortal'
import AdminDashboard from './components/AdminDashboard'
import { initializeDatabase } from './lib/supabase'

function App() {
  const [view, setView] = useState('home') // 'home', 'voter', 'admin'
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize database on first load
    const init = async () => {
      await initializeDatabase()
      setIsInitialized(true)
    }
    init()
  }, [])

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-ironwood flex items-center justify-center">
        <div className="text-sulphur text-xl">Initializing State of Cibola Election Portal...</div>
      </div>
    )
  }

  if (view === 'voter') {
    return <VoterPortal onBack={() => setView('home')} />
  }

  if (view === 'admin') {
    return <AdminDashboard onBack={() => setView('home')} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ironwood via-gray-800 to-ironwood">
      {/* Header */}
      <header className="bg-ironwood border-b-4 border-sulphur shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="official-seal">⭐</div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-sulphur">
                  State of Cibola
                </h1>
                <p className="text-sm text-gray-300">Campaign Playbook Election Portal</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sulphur font-semibold">🇺🇸</div>
              <p className="text-xs text-gray-300">Founded 2026</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-sulphur">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-federal-blue to-blue-900 text-white px-8 py-12 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-4xl font-serif font-bold mb-2">
              Official Election Portal
            </h2>
            <p className="text-xl mb-4 italic">"Ex Igne, Aurum"</p>
            <p className="text-lg opacity-90">From Fire, Gold</p>
          </div>

          {/* Portal Selection */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Voter Portal */}
              <button
                onClick={() => setView('voter')}
                className="group bg-cream hover:bg-yellow-100 border-4 border-sulphur rounded-lg p-8 transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="text-5xl mb-4">🗳️</div>
                <h3 className="text-2xl font-serif font-bold text-ironwood mb-2">
                  Voter Portal
                </h3>
                <p className="text-gray-700 mb-4">
                  Cast your official ballot for Campaign Playbook assessment rounds
                </p>
                <div className="official-badge inline-flex">
                  <span>Enter Portal →</span>
                </div>
              </button>

              {/* Admin Portal */}
              <button
                onClick={() => setView('admin')}
                className="group bg-gray-100 hover:bg-gray-200 border-4 border-ironwood rounded-lg p-8 transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="text-5xl mb-4">🔐</div>
                <h3 className="text-2xl font-serif font-bold text-ironwood mb-2">
                  Administrator Portal
                </h3>
                <p className="text-gray-700 mb-4">
                  Restricted access for election officials and authorized personnel
                </p>
                <div className="govt-button-secondary inline-flex">
                  <span>Restricted Access →</span>
                </div>
              </button>
            </div>

            {/* Information Banner */}
            <div className="bg-federal-blue text-white rounded-lg p-6 border-l-8 border-sulphur">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <span>ℹ️</span>
                <span>Official Election Information</span>
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• Four assessment rounds with ranked-choice voting</li>
                <li>• Configurable criteria per round</li>
                <li>• Real-time results and monitoring</li>
                <li>• Secure authentication and vote verification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Teams Display */}
        <div className="mt-8 bg-white rounded-lg shadow-xl p-6 border-2 border-sulphur">
          <h3 className="text-xl font-serif font-bold text-ironwood mb-4 text-center">
            Registered Campaign Teams
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Vega', code: 'NOVA47' },
              { name: 'Spence', code: 'ORBIT92' },
              { name: 'Sterling', code: 'COSMO38' },
              { name: 'Strongbow', code: 'LUNAR65' },
              { name: 'Thorne', code: 'ASTRO21' }
            ].map((team, idx) => (
              <div key={idx} className="bg-cream p-3 rounded border-2 border-sulphur text-center">
                <div className="font-bold text-ironwood">{team.name}</div>
                <div className="text-xs text-gray-600 font-mono">{team.code}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-ironwood border-t-4 border-sulphur mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sulphur">
            <p className="font-serif font-bold mb-2">
              Ex Igne, Aurum • State of Cibola • Founded 2026
            </p>
            <p className="text-sm text-gray-400">
              Contact: cibola2028@cooperativeimpactlab.org
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
