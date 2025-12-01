import React, { useState, useEffect } from 'react'
import { supabase, PHASES } from '../lib/supabase'
import VoterAuth from './VoterAuth'
import VotingInterface from './VotingInterface'
import { LogOut, CheckCircle, Clock, Award } from 'lucide-react'

export default function VoterPortal({ onBack }) {
  const [voter, setVoter] = useState(null)
  const [teams, setTeams] = useState([])
  const [voteHistory, setVoteHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for saved voter session
    const savedVoter = localStorage.getItem('cibola_voter')
    if (savedVoter) {
      try {
        const voterData = JSON.parse(savedVoter)
        setVoter(voterData)
        loadVoteHistory(voterData.voter_id)
      } catch (error) {
        console.error('Error loading saved voter:', error)
        localStorage.removeItem('cibola_voter')
      }
    }
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('id')

      if (error) throw error
      setTeams(data || [])
    } catch (error) {
      console.error('Error loading teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVoteHistory = async (voterId) => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('voter_id', voterId)
        .order('timestamp', { ascending: false })

      if (error) throw error
      setVoteHistory(data || [])
    } catch (error) {
      console.error('Error loading vote history:', error)
    }
  }

  const handleLogin = async (voterData) => {
    setVoter(voterData)
    localStorage.setItem('cibola_voter', JSON.stringify(voterData))
    await loadVoteHistory(voterData.voter_id)
  }

  const handleLogout = () => {
    setVoter(null)
    localStorage.removeItem('cibola_voter')
    setVoteHistory([])
  }

  const handleVoteSubmitted = () => {
    loadVoteHistory(voter.voter_id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ironwood flex items-center justify-center">
        <div className="text-sulphur text-xl">Loading voter portal...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ironwood via-gray-800 to-ironwood">
      {/* Header */}
      <header className="bg-ironwood border-b-4 border-sulphur shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-sulphur hover:text-yellow-400 transition-colors flex items-center gap-2"
            >
              ← Back to Home
            </button>
            <div className="flex items-center gap-4">
              <div className="official-seal text-2xl">⭐</div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-sulphur">
                  Voter Portal
                </h1>
                <p className="text-xs text-gray-300">State of Cibola Election System</p>
              </div>
            </div>
            {voter && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!voter ? (
          <VoterAuth onLogin={handleLogin} teams={teams} />
        ) : (
          <>
            {/* Voter Status Banner */}
            <div className="bg-white rounded-lg shadow-xl p-6 mb-6 border-4 border-sulphur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-sulphur rounded-full flex items-center justify-center text-2xl">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="text-green-600" size={20} />
                      <span className="font-bold text-ironwood text-lg">Verified Voter</span>
                    </div>
                    <p className="text-gray-700">
                      <span className="font-semibold">{voter.name}</span> •{' '}
                      Team: <span className="font-bold text-federal-blue">{voter.team_name}</span>
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      Session ID: {voter.voter_id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock size={18} />
                    <span className="text-sm">Ballots Cast</span>
                  </div>
                  <div className="text-3xl font-bold text-federal-blue">
                    {voteHistory.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Vote History Summary */}
            {voteHistory.length > 0 && (
              <div className="bg-cream rounded-lg shadow-lg p-4 mb-6 border-2 border-sulphur">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="text-sulphur" size={20} />
                  <h3 className="font-serif font-bold text-ironwood">Your Voting Record</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PHASES.map(phaseInfo => {
                    const phaseVote = voteHistory.find(v => v.phase === phaseInfo.id)
                    return (
                      <div key={phaseInfo.id} className="bg-white p-3 rounded border border-gray-300">
                        <div className="text-xs font-semibold text-gray-600 mb-1">Phase {phaseInfo.id}</div>
                        <div className="text-xs font-bold text-ironwood mb-1">{phaseInfo.name}</div>
                        <div className="text-sm font-bold text-federal-blue">
                          {phaseVote ? '✅ Voted' : '⏳ Pending'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Voting Interface */}
            <VotingInterface
              voter={voter}
              teams={teams}
              onVoteSubmitted={handleVoteSubmitted}
            />
          </>
        )}
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
