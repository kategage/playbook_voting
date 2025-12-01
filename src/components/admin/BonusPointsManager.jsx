import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Gift, AlertCircle } from 'lucide-react'

export default function BonusPointsManager({ teams }) {
  const [bonusPoints, setBonusPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBonus, setNewBonus] = useState({
    team_id: '',
    points: '',
    reason: ''
  })

  useEffect(() => {
    loadBonusPoints()

    // Subscribe to bonus points changes
    const subscription = supabase
      .channel('bonus_points_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bonus_points'
      }, () => {
        loadBonusPoints()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadBonusPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('bonus_points')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBonusPoints(data || [])
    } catch (error) {
      console.error('Error loading bonus points:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBonus = async () => {
    if (!newBonus.team_id || !newBonus.points || !newBonus.reason) {
      alert('Please fill in all fields.')
      return
    }

    try {
      const { error } = await supabase
        .from('bonus_points')
        .insert({
          team_id: parseInt(newBonus.team_id),
          points: parseInt(newBonus.points),
          reason: newBonus.reason,
          awarded_by: 'Admin'
        })

      if (error) throw error

      setNewBonus({ team_id: '', points: '', reason: '' })
      setShowAddForm(false)
      await loadBonusPoints()
    } catch (error) {
      console.error('Error adding bonus points:', error)
      alert('Failed to add bonus points.')
    }
  }

  const handleDeleteBonus = async (id) => {
    if (!confirm('Are you sure you want to delete this bonus points entry?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('bonus_points')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadBonusPoints()
    } catch (error) {
      console.error('Error deleting bonus points:', error)
      alert('Failed to delete bonus points.')
    }
  }

  const getTeamName = (teamId) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown'
  }

  const getTotalBonusByTeam = () => {
    const totals = {}
    teams.forEach(team => {
      totals[team.id] = 0
    })
    bonusPoints.forEach(bonus => {
      totals[bonus.team_id] = (totals[bonus.team_id] || 0) + bonus.points
    })
    return totals
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 border-4 border-sulphur">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-federal-blue mx-auto"></div>
      </div>
    )
  }

  const bonusTotals = getTotalBonusByTeam()

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-sulphur">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gift className="text-white" size={28} />
            <div>
              <h2 className="text-2xl font-serif font-bold text-white">
                Bonus Points Management
              </h2>
              <p className="text-sm text-green-100">
                Award bonus points for extra credit, penalties, or special achievements
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-md hover:bg-green-50 transition-colors font-semibold"
          >
            <Plus size={20} />
            Add Bonus
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-b-2 border-blue-300 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-blue-800">
            Bonus points can be positive (rewards) or negative (penalties). They are added to each
            team's total score in the final results and leaderboard.
          </p>
        </div>
      </div>

      <div className="p-6">
        {/* Add Bonus Form */}
        {showAddForm && (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-green-900 mb-4 text-lg">Add Bonus Points</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Team
                </label>
                <select
                  value={newBonus.team_id}
                  onChange={(e) => setNewBonus({ ...newBonus, team_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-600 focus:outline-none"
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Points (can be negative)
                </label>
                <input
                  type="number"
                  value={newBonus.points}
                  onChange={(e) => setNewBonus({ ...newBonus, points: e.target.value })}
                  placeholder="e.g., 10 or -5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={newBonus.reason}
                  onChange={(e) => setNewBonus({ ...newBonus, reason: e.target.value })}
                  placeholder="e.g., Extra Credit Round 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-green-600 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddBonus}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold"
              >
                <Plus size={18} />
                Add Bonus Points
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

        {/* Bonus Totals by Team */}
        <div className="mb-6">
          <h3 className="font-bold text-ironwood mb-3 text-lg">Bonus Points Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {teams.map(team => (
              <div
                key={team.id}
                className={`p-4 rounded-lg border-2 ${
                  bonusTotals[team.id] > 0
                    ? 'border-green-500 bg-green-50'
                    : bonusTotals[team.id] < 0
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="font-bold text-ironwood mb-1">{team.name}</div>
                <div className={`text-2xl font-bold ${
                  bonusTotals[team.id] > 0
                    ? 'text-green-600'
                    : bonusTotals[team.id] < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {bonusTotals[team.id] > 0 ? '+' : ''}{bonusTotals[team.id]}
                </div>
                <div className="text-xs text-gray-600">bonus points</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bonus Points List */}
        <div>
          <h3 className="font-bold text-ironwood mb-3 text-lg">All Bonus Points Entries</h3>
          {bonusPoints.length > 0 ? (
            <div className="space-y-3">
              {bonusPoints.map((bonus) => (
                <div
                  key={bonus.id}
                  className="flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg text-ironwood">
                        {getTeamName(bonus.team_id)}
                      </span>
                      <span className={`text-2xl font-bold ${
                        bonus.points > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {bonus.points > 0 ? '+' : ''}{bonus.points}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <strong>Reason:</strong> {bonus.reason}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Added {new Date(bonus.created_at).toLocaleString()} by {bonus.awarded_by}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBonus(bonus.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete bonus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Gift className="mx-auto mb-3 text-gray-400" size={48} />
              <p>No bonus points awarded yet. Click "Add Bonus" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
