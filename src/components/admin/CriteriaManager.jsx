import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, Save, X, AlertTriangle, Sparkles } from 'lucide-react'

export default function CriteriaManager() {
  const [criteria, setCriteria] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCriterion, setNewCriterion] = useState({
    id: '',
    name: '',
    icon: '⭐',
    rounds: [1, 2, 3, 4],
    description: '',
    display_order: 0,
    is_active: true
  })

  useEffect(() => {
    loadCriteria()

    // Subscribe to criteria changes
    const subscription = supabase
      .channel('criteria_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'criteria'
      }, () => {
        loadCriteria()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadCriteria = async () => {
    try {
      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .order('display_order')

      if (error) throw error
      setCriteria(data || [])
    } catch (error) {
      console.error('Error loading criteria:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCriterion = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('criteria')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      await loadCriteria()
      setEditingId(null)
    } catch (error) {
      console.error('Error updating criterion:', error)
      alert('Failed to update criterion. Please try again.')
    }
  }

  const handleAddCriterion = async () => {
    try {
      // Validate
      if (!newCriterion.id || !newCriterion.name) {
        alert('Please provide both ID and name for the criterion.')
        return
      }

      // Get max display order
      const maxOrder = Math.max(...criteria.map(c => c.display_order), 0)

      const { error } = await supabase
        .from('criteria')
        .insert({
          ...newCriterion,
          display_order: maxOrder + 1
        })

      if (error) throw error

      // Reset form
      setNewCriterion({
        id: '',
        name: '',
        icon: '⭐',
        rounds: [1, 2, 3, 4],
        description: '',
        display_order: 0,
        is_active: true
      })
      setShowAddForm(false)
      await loadCriteria()
    } catch (error) {
      console.error('Error adding criterion:', error)
      alert('Failed to add criterion. The ID might already exist.')
    }
  }

  const handleDeleteCriterion = async (id) => {
    if (!confirm('Are you sure you want to delete this criterion? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('criteria')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadCriteria()
    } catch (error) {
      console.error('Error deleting criterion:', error)
      alert('Failed to delete criterion. It may be in use.')
    }
  }

  const toggleRound = (criterion, round) => {
    const rounds = criterion.rounds.includes(round)
      ? criterion.rounds.filter(r => r !== round)
      : [...criterion.rounds, round].sort()

    handleUpdateCriterion(criterion.id, { rounds })
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
      {/* Header */}
      <div className="bg-gradient-to-r from-sulphur to-yellow-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-ironwood" size={28} />
            <div>
              <h2 className="text-2xl font-serif font-bold text-ironwood">
                Assessment Criteria Configuration
              </h2>
              <p className="text-sm text-gray-700">
                Define and manage voting criteria • Changes apply to future rounds only
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-ironwood text-sulphur rounded-md hover:bg-gray-800 transition-colors font-semibold"
          >
            <Plus size={20} />
            Add Criterion
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-b-2 border-yellow-400 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Modifying criteria names or rounds only affects future
            voting. Historical votes and results are preserved with their original criterion data.
          </p>
        </div>
      </div>

      <div className="p-6">
        {/* Add New Criterion Form */}
        {showAddForm && (
          <div className="bg-cream border-2 border-sulphur rounded-lg p-6 mb-6">
            <h3 className="font-bold text-ironwood mb-4 text-lg">Add New Criterion</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Criterion ID (unique, lowercase)
                </label>
                <input
                  type="text"
                  value={newCriterion.id}
                  onChange={(e) => setNewCriterion({
                    ...newCriterion,
                    id: e.target.value.toLowerCase().replace(/\s+/g, '_')
                  })}
                  placeholder="e.g., innovation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-federal-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newCriterion.name}
                  onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
                  placeholder="e.g., Innovation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-federal-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Icon (emoji)
                </label>
                <input
                  type="text"
                  value={newCriterion.icon}
                  onChange={(e) => setNewCriterion({ ...newCriterion, icon: e.target.value })}
                  placeholder="⭐"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-federal-blue focus:outline-none text-2xl"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Active Rounds
                </label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4].map(round => (
                    <label key={round} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={newCriterion.rounds.includes(round)}
                        onChange={(e) => {
                          const rounds = e.target.checked
                            ? [...newCriterion.rounds, round].sort()
                            : newCriterion.rounds.filter(r => r !== round)
                          setNewCriterion({ ...newCriterion, rounds })
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">R{round}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newCriterion.description}
                onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })}
                placeholder="Brief description of what this criterion measures"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-federal-blue focus:outline-none"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCriterion}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold"
              >
                <Save size={18} />
                Save Criterion
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Criteria List */}
        <div className="space-y-4">
          {criteria.map((criterion) => (
            <div
              key={criterion.id}
              className={`border-2 rounded-lg p-4 transition-all ${
                criterion.is_active
                  ? 'border-gray-300 bg-white'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl">{criterion.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-ironwood">
                        {criterion.name}
                      </h3>
                      <p className="text-sm text-gray-600">ID: {criterion.id}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{criterion.description}</p>

                  {/* Round Checkboxes */}
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm font-semibold text-gray-700">Active in Rounds:</span>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4].map(round => (
                        <label
                          key={round}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={criterion.rounds.includes(round)}
                            onChange={() => toggleRound(criterion, round)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-sm font-medium">Round {round}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-1 rounded ${
                      criterion.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {criterion.is_active ? '✓ Active' : '✗ Inactive'}
                    </span>
                    <span className="text-gray-500">
                      • Display Order: {criterion.display_order}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateCriterion(criterion.id, {
                      is_active: !criterion.is_active
                    })}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                      criterion.is_active
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {criterion.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteCriterion(criterion.id)}
                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                    title="Delete criterion"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {criteria.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Sparkles className="mx-auto mb-3 text-gray-400" size={48} />
            <p>No criteria configured yet. Click "Add Criterion" to create one.</p>
          </div>
        )}
      </div>
    </div>
  )
}
