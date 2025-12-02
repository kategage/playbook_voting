import React, { useState, useEffect } from 'react'
import { supabase, PHASES, METRICS } from '../../lib/supabase'
import { BarChart3, Download, Trophy, Award, TrendingUp } from 'lucide-react'

export default function ResultsTab() {
  const [teams, setTeams] = useState([])
  const [votes, setVotes] = useState([])
  const [bonusPoints, setBonusPoints] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([
      loadTeams(),
      loadVotes(),
      loadBonusPoints()
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

  const loadVotes = async () => {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
    if (!error) setVotes(data || [])
  }

  const loadBonusPoints = async () => {
    const { data, error } = await supabase
      .from('bonus_points')
      .select('*')
    if (!error) setBonusPoints(data || [])
  }

  const calculateTeamScores = () => {
    const teamScores = {}

    // Initialize scores for all teams
    teams.forEach(team => {
      teamScores[team.id] = {
        team: team,
        sliderScores: 0,      // Phases 1-3
        rankingPoints: 0,     // Phase 4
        bonusPoints: 0,       // Admin awarded
        totalPoints: 0,
        phaseBreakdown: {
          1: 0, 2: 0, 3: 0, 4: 0
        }
      }
    })

    // Calculate slider scores (Phases 1-3)
    votes.filter(v => v.vote_type === 'slider').forEach(vote => {
      const voteData = vote.vote_data || {}

      // Sum all scores given TO each team
      teams.forEach(team => {
        METRICS.forEach(metric => {
          const scoreKey = `${team.id}-${metric.id}`
          const score = voteData[scoreKey]
          if (score) {
            teamScores[team.id].sliderScores += score
            teamScores[team.id].phaseBreakdown[vote.phase] += score
          }
        })
      })
    })

    // Calculate ranking points (Phase 4)
    votes.filter(v => v.vote_type === 'ranking').forEach(vote => {
      const rankings = vote.vote_data?.rankings || []
      rankings.forEach((teamId, index) => {
        const points = 5 - index // 1st=5, 2nd=4, 3rd=3, 4th=2
        if (teamScores[teamId]) {
          teamScores[teamId].rankingPoints += points
          teamScores[teamId].phaseBreakdown[4] += points
        }
      })
    })

    // Calculate bonus points
    bonusPoints.forEach(bonus => {
      if (teamScores[bonus.team_id]) {
        teamScores[bonus.team_id].bonusPoints += bonus.points
      }
    })

    // Calculate totals
    Object.values(teamScores).forEach(score => {
      score.totalPoints = score.sliderScores + score.rankingPoints + score.bonusPoints
    })

    // Sort by total points descending
    return Object.values(teamScores).sort((a, b) => b.totalPoints - a.totalPoints)
  }

  const exportToCSV = () => {
    const scores = calculateTeamScores()
    const headers = ['Rank,Team,Slider Scores (P1-3),Ranking Points (P4),Bonus Points,Total Points']
    const rows = scores.map((score, index) =>
      `${index + 1},${score.team.name},${score.sliderScores},${score.rankingPoints},${score.bonusPoints},${score.totalPoints}`
    )
    const csv = headers.concat(rows).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cibola-election-results-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return '🏅'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-12 text-center border-4 border-sulphur">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Calculating results...</p>
      </div>
    )
  }

  const teamScores = calculateTeamScores()
  const totalVotes = votes.length

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-sulphur" size={24} />
            <span className="text-sm font-semibold text-gray-600">Total Ballots</span>
          </div>
          <div className="text-4xl font-bold text-ironwood">{totalVotes}</div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="text-federal-blue" size={24} />
            <span className="text-sm font-semibold text-gray-600">Teams</span>
          </div>
          <div className="text-4xl font-bold text-ironwood">{teams.length}</div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
          <div className="flex items-center gap-3 mb-2">
            <Award className="text-green-600" size={24} />
            <span className="text-sm font-semibold text-gray-600">Phases Complete</span>
          </div>
          <div className="text-4xl font-bold text-ironwood">
            {votes.filter(v => v.phase === 4).length > 0 ? '4/4' :
             votes.filter(v => v.phase === 3).length > 0 ? '3/4' :
             votes.filter(v => v.phase === 2).length > 0 ? '2/4' :
             votes.filter(v => v.phase === 1).length > 0 ? '1/4' : '0/4'}
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportToCSV}
          className="govt-button flex items-center gap-2"
        >
          <Download size={20} />
          Export Results (CSV)
        </button>
      </div>

      {/* Overall Rankings */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-sulphur">
        <div className="bg-gradient-to-r from-sulphur to-yellow-600 px-6 py-6">
          <h2 className="text-3xl font-serif font-bold text-ironwood flex items-center gap-3">
            <Trophy size={32} />
            Official Election Results
          </h2>
          <p className="text-sm text-gray-800 mt-1">
            Combined scores from all phases + bonus points
          </p>
        </div>

        <div className="p-6">
          {teamScores.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Trophy className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-lg font-semibold mb-2">No Results Available Yet</p>
              <p className="text-sm">Teams will appear here once they are registered in the Setup tab.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamScores.map((score, index) => {
              const rank = index + 1
              const isWinner = rank === 1
              return (
                <div
                  key={score.team.id}
                  className={`rounded-lg p-6 border-4 ${
                    isWinner
                      ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-sulphur shadow-xl'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-6xl">{getMedalEmoji(rank)}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={`text-3xl font-bold ${isWinner ? 'text-sulphur' : 'text-ironwood'}`}>
                            #{rank}
                          </h3>
                          <h4 className="text-2xl font-bold text-ironwood">{score.team.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          {isWinner && '🎊 Winner! 🎊'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-5xl font-bold ${isWinner ? 'text-sulphur' : 'text-federal-blue'}`}>
                        {score.totalPoints}
                      </div>
                      <div className="text-sm text-gray-600 font-semibold">Total Points</div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t-2 border-gray-200">
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Slider Scores</div>
                      <div className="text-xs text-gray-500 mb-2">Phases 1-3</div>
                      <div className="text-2xl font-bold text-federal-blue">{score.sliderScores}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Ranking Points</div>
                      <div className="text-xs text-gray-500 mb-2">Phase 4</div>
                      <div className="text-2xl font-bold text-green-600">{score.rankingPoints}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Bonus Points</div>
                      <div className="text-xs text-gray-500 mb-2">Admin Awarded</div>
                      <div className={`text-2xl font-bold ${score.bonusPoints >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                        {score.bonusPoints >= 0 ? '+' : ''}{score.bonusPoints}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Phase Breakdown</div>
                      <div className="text-xs text-gray-500 grid grid-cols-4 gap-1 mt-2">
                        <div className="text-center">
                          <div className="font-bold">P1</div>
                          <div>{score.phaseBreakdown[1]}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">P2</div>
                          <div>{score.phaseBreakdown[2]}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">P3</div>
                          <div>{score.phaseBreakdown[3]}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">P4</div>
                          <div>{score.phaseBreakdown[4]}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          )}
        </div>
      </div>

      {/* Methodology */}
      <div className="bg-blue-50 border-2 border-federal-blue rounded-lg p-6">
        <h3 className="font-bold text-federal-blue mb-3 flex items-center gap-2">
          <TrendingUp size={20} />
          Scoring Methodology
        </h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Phases 1-3 (Slider Voting):</strong> Teams are evaluated on 3 metrics (Innovation, Adaptability, Impact) with scores 1-5. All scores are summed.</p>
          <p><strong>Phase 4 (Ranked Voting):</strong> Traditional ranked-choice. 1st place = 5 points, 2nd = 4 points, 3rd = 3 points, 4th = 2 points.</p>
          <p><strong>Bonus Points:</strong> Admin-awarded points (positive or negative) for special achievements or penalties.</p>
          <p><strong>Total Points:</strong> Sum of all slider scores + ranking points + bonus points.</p>
        </div>
      </div>
    </div>
  )
}
