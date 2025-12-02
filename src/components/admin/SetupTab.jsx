import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import BonusPointsManager from './BonusPointsManager'
import TeamManager from './TeamManager'
import VoterManager from './VoterManager'
import PhaseLocksManager from './PhaseLocksManager'
import { AlertCircle } from 'lucide-react'

export default function SetupTab() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-12 text-center border-4 border-sulphur">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Loading setup configuration...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-federal-blue rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-federal-blue flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-bold text-federal-blue mb-2">Setup & Configuration</h3>
            <p className="text-sm text-gray-700">
              Configure teams, voter registration, bonus points, and phase controls.
              Voting system uses fixed metrics (Innovation, Adaptability, Impact) for phases 1-3,
              and ranked choice for Phase 4 (The Final Election).
            </p>
          </div>
        </div>
      </div>

      {/* Team Configuration */}
      <TeamManager teams={teams} onTeamsUpdated={loadTeams} />

      {/* Voter Management */}
      <VoterManager teams={teams} />

      {/* Bonus Points Management */}
      <BonusPointsManager teams={teams} />

      {/* Phase Lock Controls */}
      <PhaseLocksManager />
    </div>
  )
}
