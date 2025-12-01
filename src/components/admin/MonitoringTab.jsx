import React, { useState, useEffect } from 'react'
import { supabase, PHASES } from '../../lib/supabase'
import { Activity, Users, Clock, TrendingUp } from 'lucide-react'

export default function MonitoringTab() {
  const [teams, setTeams] = useState([])
  const [voters, setVoters] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhase, setSelectedPhase] = useState(1)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    loadData()

    // Subscribe to vote changes
    const subscription = supabase
      .channel('votes_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes'
      }, () => {
        loadVotes()
        setLastUpdate(new Date())
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadData = async () => {
    await Promise.all([
      loadTeams(),
      loadVoters(),
      loadVotes()
    ])
    setLoading(false)
  }

  const loadTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('id')
    if (!error) setTeams(data || [])
  }

  const loadVoters = async () => {
    const { data, error } = await supabase
      .from('voters')
      .select('*')
    if (!error) setVoters(data || [])
  }

  const loadVotes = async () => {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .order('timestamp', { ascending: false })
    if (!error) setVotes(data || [])
  }

  const getTeamStats = (teamId, phase) => {
    const teamVoters = voters.filter(v => v.team_id === teamId)
    const expectedVotes = teamVoters.length // 1 vote per phase per voter

    const actualVotes = votes.filter(v =>
      v.team_id === teamId && v.phase === phase
    ).length

    return {
      voters: teamVoters.length,
      voted: actualVotes,
      expected: expectedVotes,
      percentage: expectedVotes > 0 ? Math.round((actualVotes / expectedVotes) * 100) : 0
    }
  }

  const getRecentVotes = (limit = 10) => {
    return votes.slice(0, limit).map(vote => {
      const voter = voters.find(v => v.voter_id === vote.voter_id)
      const team = teams.find(t => t.id === vote.team_id)
      const phaseInfo = PHASES.find(p => p.id === vote.phase)
      return {
        ...vote,
        voter_name: voter?.name || 'Unknown',
        team_name: team?.name || 'Unknown',
        phase_name: phaseInfo?.name || `Phase ${vote.phase}`,
        vote_type_display: vote.vote_type === 'slider' ? '📊 Slider' : '🏆 Ranking'
      }
    })
  }

  const getTotalProgress = () => {
    const totalVoters = voters.length
    const expectedTotal = totalVoters * 4 // 4 phases
    const actualTotal = votes.length
    return {
      total: actualTotal,
      expected: expectedTotal,
      percentage: expectedTotal > 0 ? Math.round((actualTotal / expectedTotal) * 100) : 0
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-12 text-center border-4 border-sulphur">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Loading monitoring data...</p>
      </div>
    )
  }

  const totalProgress = getTotalProgress()
  const recentVotes = getRecentVotes(15)
  const selectedPhaseInfo = PHASES.find(p => p.id === selectedPhase)

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-federal-blue" size={24} />
            <span className="text-sm font-semibold text-gray-600">Total Voters</span>
          </div>
          <div className="text-4xl font-bold text-ironwood">{voters.length}</div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="text-green-600" size={24} />
            <span className="text-sm font-semibold text-gray-600">Ballots Cast</span>
          </div>
          <div className="text-4xl font-bold text-ironwood">{votes.length}</div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-sulphur" size={24} />
            <span className="text-sm font-semibold text-gray-600">Participation</span>
          </div>
          <div className="text-4xl font-bold text-ironwood">{totalProgress.percentage}%</div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-gray-600" size={24} />
            <span className="text-sm font-semibold text-gray-600">Last Update</span>
          </div>
          <div className="text-sm font-mono text-ironwood">
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Phase Selector */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
        <h2 className="text-xl font-serif font-bold text-ironwood mb-4">Select Phase to Monitor</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PHASES.map(phase => (
            <button
              key={phase.id}
              onClick={() => setSelectedPhase(phase.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedPhase === phase.id
                  ? 'border-federal-blue bg-federal-blue text-white font-bold'
                  : 'border-gray-300 bg-white hover:border-federal-blue'
              }`}
            >
              <div className="text-sm font-semibold mb-1">Phase {phase.id}</div>
              <div className="text-xs">{phase.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Team Progress for Selected Phase */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-sulphur">
        <div className="bg-gradient-to-r from-federal-blue to-blue-900 px-6 py-4">
          <h2 className="text-2xl font-serif font-bold text-white">
            {selectedPhaseInfo?.name} Progress by Team
          </h2>
          <p className="text-sm text-blue-100">
            Phase {selectedPhase} • {selectedPhaseInfo?.type === 'slider' ? 'Slider Voting' : 'Ranked Voting'}
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {teams.map(team => {
              const stats = getTeamStats(team.id, selectedPhase)
              return (
                <div key={team.id} className="border-2 border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-sulphur rounded-full flex items-center justify-center font-bold text-ironwood text-xl">
                        {team.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-ironwood">{team.name}</h3>
                        <p className="text-sm text-gray-600">{stats.voters} voters</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-federal-blue">
                        {stats.percentage}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {stats.voted}/{stats.expected} ballots
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all"
                      style={{ width: `${stats.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-sulphur">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Activity size={24} />
            Recent Voting Activity
          </h2>
          <p className="text-sm text-green-100">Live feed of ballot submissions</p>
        </div>

        <div className="divide-y divide-gray-200">
          {recentVotes.length > 0 ? (
            recentVotes.map((vote, idx) => (
              <div key={vote.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{vote.vote_type === 'slider' ? '📊' : '🏆'}</div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {vote.voter_name} ({vote.team_name})
                      </div>
                      <div className="text-sm text-gray-600">
                        {vote.phase_name} • {vote.vote_type_display}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {new Date(vote.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Activity className="mx-auto mb-3 text-gray-400" size={48} />
              <p>No voting activity yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
