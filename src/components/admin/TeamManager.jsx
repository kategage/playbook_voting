import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Edit2, Save, X } from 'lucide-react'

export default function TeamManager({ teams, onTeamsUpdated }) {
  const [editingTeam, setEditingTeam] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')

  const startEdit = (team) => {
    setEditingTeam(team.id)
    setEditName(team.name)
    setEditCode(team.code)
  }

  const cancelEdit = () => {
    setEditingTeam(null)
    setEditName('')
    setEditCode('')
  }

  const saveEdit = async (teamId) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: editName,
          code: editCode.toUpperCase()
        })
        .eq('id', teamId)

      if (error) throw error

      cancelEdit()
      onTeamsUpdated()
    } catch (error) {
      console.error('Error updating team:', error)
      alert('Failed to update team. The code might already be in use.')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-sulphur">
      <div className="bg-gradient-to-r from-federal-blue to-blue-900 px-6 py-4">
        <div className="flex items-center gap-3">
          <Users className="text-white" size={28} />
          <div>
            <h2 className="text-2xl font-serif font-bold text-white">
              Team Configuration
            </h2>
            <p className="text-sm text-blue-100">
              Edit team names and access codes
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center gap-4 p-4 border-2 border-gray-300 rounded-lg hover:border-federal-blue transition-colors"
            >
              <div className="w-12 h-12 bg-sulphur rounded-full flex items-center justify-center font-bold text-ironwood text-xl">
                {team.name[0]}
              </div>

              {editingTeam === team.id ? (
                <>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Team Name"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:border-federal-blue focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                      placeholder="Team Code"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:border-federal-blue focus:outline-none font-mono"
                      maxLength={10}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(team.id)}
                      className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      title="Save"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-ironwood">{team.name}</div>
                    <div className="text-sm text-gray-600 font-mono">Code: {team.code}</div>
                  </div>
                  <button
                    onClick={() => startEdit(team)}
                    className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    title="Edit team"
                  >
                    <Edit2 size={18} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
