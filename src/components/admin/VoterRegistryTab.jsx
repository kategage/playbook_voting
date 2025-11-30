import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, CheckCircle, Clock, Filter } from 'lucide-react'

export default function VoterRegistryTab() {
  const [teams, setTeams] = useState([])
  const [voters, setVoters] = useState([])
  const [votes, setVotes] = useState([])
  const [criteria, setCriteria] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTeam, setFilterTeam] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([
      loadTeams(),
      loadVoters(),
      loadVotes(),
      loadCriteria()
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
      .order('team_id, name')
    if (!error) setVoters(data || [])
  }

  const loadVotes = async () => {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
    if (!error) setVotes(data || [])
  }

  const loadCriteria = async () => {
    const { data, error } = await supabase
      .from('criteria')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    if (!error) setCriteria(data || [])
  }

  const hasVoted = (voterId, round, criterion) => {
    return votes.some(v =>
      v.voter_id === voterId &&
      v.round === round &&
      v.criterion === criterion
    )
  }

  const getVoterTeam = (teamId) => {
    return teams.find(t => t.id === teamId)
  }

  const filteredVoters = filterTeam === 'all'
    ? voters
    : voters.filter(v => v.team_id === parseInt(filterTeam))

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-12 text-center border-4 border-sulphur">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Loading voter registry...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-federal-blue" size={28} />
            <div>
              <h2 className="text-2xl font-serif font-bold text-ironwood">
                Complete Voter Registry
              </h2>
              <p className="text-sm text-gray-600">
                {filteredVoters.length} voters • Detailed voting status matrix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-600" size={20} />
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-md focus:border-federal-blue focus:outline-none"
            >
              <option value="all">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Voter Registry Table */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-sulphur">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-federal-blue to-blue-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Name</th>
                <th className="px-4 py-3 text-left font-bold">Team</th>
                <th className="px-4 py-3 text-left font-bold">Voter ID</th>
                {[1, 2, 3, 4].map(round => {
                  const roundCriteria = criteria.filter(c => c.rounds.includes(round))
                  return roundCriteria.map(criterion => (
                    <th
                      key={`${round}-${criterion.id}`}
                      className="px-2 py-3 text-center font-bold border-l border-blue-700"
                      title={`Round ${round} - ${criterion.name}`}
                    >
                      <div className="text-xs">R{round}</div>
                      <div>{criterion.icon}</div>
                    </th>
                  ))
                })}
                <th className="px-4 py-3 text-center font-bold border-l-2 border-sulphur">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVoters.map((voter, idx) => {
                const team = getVoterTeam(voter.team_id)
                let totalVotes = 0

                return (
                  <tr
                    key={voter.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {voter.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-cream rounded text-sm font-semibold text-ironwood">
                        {team?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {voter.voter_id}
                    </td>
                    {[1, 2, 3, 4].map(round => {
                      const roundCriteria = criteria.filter(c => c.rounds.includes(round))
                      return roundCriteria.map(criterion => {
                        const voted = hasVoted(voter.voter_id, round, criterion.id)
                        if (voted) totalVotes++

                        return (
                          <td
                            key={`${round}-${criterion.id}`}
                            className="px-2 py-3 text-center border-l border-gray-200"
                          >
                            {voted ? (
                              <CheckCircle className="inline text-green-600" size={18} />
                            ) : (
                              <Clock className="inline text-gray-300" size={18} />
                            )}
                          </td>
                        )
                      })
                    })}
                    <td className="px-4 py-3 text-center border-l-2 border-sulphur">
                      <span className={`px-3 py-1 rounded font-bold ${
                        totalVotes > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {totalVotes}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredVoters.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <Users className="mx-auto mb-3 text-gray-400" size={48} />
            <p>No voters found matching the current filter.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
        <h3 className="font-bold text-ironwood mb-4">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-sm">Ballot Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-gray-300" size={20} />
            <span className="text-sm">Pending Vote</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-cream rounded border border-sulphur"></div>
            <span className="text-sm">Team Badge</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg">🎨⚡🔄</div>
            <span className="text-sm">Criterion Icons</span>
          </div>
        </div>

        {/* Criteria Reference */}
        <div className="mt-4 pt-4 border-t-2 border-gray-200">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Active Criteria:</h4>
          <div className="flex flex-wrap gap-3">
            {criteria.map(criterion => (
              <div
                key={criterion.id}
                className="bg-cream px-3 py-2 rounded border border-sulphur text-sm"
              >
                <span className="mr-2">{criterion.icon}</span>
                <span className="font-semibold">{criterion.name}</span>
                <span className="text-gray-600 ml-2">
                  (Rounds: {criterion.rounds.join(', ')})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
