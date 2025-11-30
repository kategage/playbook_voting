import React, { useState } from 'react'
import AdminAuth from './AdminAuth'
import SetupTab from './admin/SetupTab'
import MonitoringTab from './admin/MonitoringTab'
import ResultsTab from './admin/ResultsTab'
import VoterRegistryTab from './admin/VoterRegistryTab'
import { Settings, Activity, BarChart3, Users, Shield } from 'lucide-react'

export default function AdminDashboard({ onBack }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('setup')

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} onBack={onBack} />
  }

  const tabs = [
    { id: 'setup', label: 'Setup', icon: Settings, component: SetupTab },
    { id: 'monitoring', label: 'Live Monitoring', icon: Activity, component: MonitoringTab },
    { id: 'results', label: 'Results', icon: BarChart3, component: ResultsTab },
    { id: 'registry', label: 'Voter Registry', icon: Users, component: VoterRegistryTab }
  ]

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component

  return (
    <div className="min-h-screen bg-gradient-to-b from-ironwood via-gray-800 to-ironwood">
      {/* Header */}
      <header className="bg-ironwood border-b-4 border-red-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              ← Exit Admin Portal
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-2xl">
                🔐
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-sulphur flex items-center gap-2">
                  <Shield size={24} className="text-red-500" />
                  Administrator Portal
                </h1>
                <p className="text-xs text-gray-300">State of Cibola Election Management System</p>
              </div>
            </div>
            <div className="official-badge bg-red-600 text-white border-2 border-red-400">
              Restricted Access
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-xl mb-6 border-4 border-sulphur overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-gray-300">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 flex items-center justify-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? 'bg-federal-blue text-white font-bold'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Tab Content */}
        {ActiveComponent && <ActiveComponent />}
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
