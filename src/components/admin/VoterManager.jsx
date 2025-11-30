import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { UserPlus, Users, Trash2, Edit2 } from 'lucide-react'

export default function VoterManager({ teams }) {
  const [voters, setVoters] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVoter, setNewVoter] = useState({ name: '', team_id: '' })

  useEffect(() => {
    loadVoters()
    loadVotes()
  }, [])

  const loadVoters = async () => {
    try {
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .order('team_id')

      if (error) throw error
      setVoters(data || [])
    } catch (error) {
      console.error('Error loading voters:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('voter_id, round, criterion')

      if (error) throw error
      setVotes(data || [])
    } catch (error) {
      console.error('Error loading votes:', error)
    }
  }

  const handleAddVoter = async () => {
    if (!newVoter.name.trim() || !newVoter.team_id) {
      alert('Please provide both name and team.')
      return
    }

    try {
      const team = teams.find(t => t.id === parseInt(newVoter.team_id))
      const voterId = `${team.code}-${newVoter.name.toUpperCase()}-${Date.now().toString().slice(-6)}`

      const { error } = await supabase
        .from('voters')
        .insert({
          voter_id: voterId,
          name: newVoter.name.trim(),
          team_id: parseInt(newVoter.team_id)
        })

      if (error) throw error

      setNewVoter({ name: '', team_id: '' })
      setShowAddForm(false)
      loadVoters()
    } catch (error) {
      console.error('Error adding voter:', error)
      alert('Failed to add voter.')
    }
  }

  const handleDeleteVoter = async (voterId) => {
    if (!confirm('Are you sure you want to remove this voter? Their votes will remain in the system.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('voters')
        .delete()
        .eq('voter_id', voterId)

      if (error) throw error
      loadVoters()
    } catch (error) {
      console.error('Error deleting voter:', error)
      alert('Failed to delete voter.')
    }
  }

  const getVoterProgress = (voterId) => {
    const voterVotes = votes.filter(v => v.voter_id === voterId)
    return voterVotes.length
  }

  const getTeamVoters = (teamId) => {
    return voters.filter(v => v.team_id === teamId)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 border-4 border-sulphur">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-federal-blue mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-sulphur">
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-white" size={28} />
            <div>
              <h2 className="text-2xl font-serif font-bold text-white">
                Voter Management
              </h2>
              <p className="text-sm text-green-100">
                Add voters and track participation • {voters.length} total voters
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-md hover:bg-green-50 transition-colors font-semibold"
          >
            <UserPlus size={20} />
            Add Voter
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Add Voter Form */}
        {showAddForm && (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-green-900 mb-3">Add New Voter</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={newVoter.name}
                onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
                placeholder="First Name"
                className="px-3 py-2 border border-gray-300 rounded-md focus:border-green-600 focus:outline-none"
              />
              <select
                value={newVoter.team_id}
                onChange={(e) => setNewVoter({ ...newVoter, team_id: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:border-green-600 focus:outline-none"
              >
                <option value="">Select Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddVoter}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold"
              >
                Add Voter
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Voters by Team */}
        <div className="space-y-6">
          {teams.map(team => {
            const teamVoters = getTeamVoters(team.id)
            if (teamVoters.length === 0) return null

            return (
              <div key={team.id} className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-cream px-4 py-3 border-b-2 border-sulphur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sulphur rounded-full flex items-center justify-center font-bold text-ironwood">
                        {team.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-ironwood text-lg">{team.name}</h3>
                        <p className="text-sm text-gray-600">{teamVoters.length} voters</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {teamVoters.map(voter => {
                    const voteCount = getVoterProgress(voter.voter_id)
                    return (
                      <div
                        key={voter.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{voter.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{voter.voter_id}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className={`px-2 py-1 rounded ${
                              voteCount > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {voteCount > 0 ? `✅ ${voteCount} votes` : '⏳ No votes'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteVoter(voter.voter_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove voter"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {voters.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <UserPlus className="mx-auto mb-3 text-gray-400" size={48} />
            <p>No voters registered yet. Click "Add Voter" to register voters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
