import React, { useState, useEffect } from 'react'
import { supabase, PHASES, METRICS } from '../../lib/supabase'
import { BarChart3, Download, TrendingUp, Award, Filter } from 'lucide-react'

export default function AnalyticsTab() {
  const [teams, setTeams] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhase, setSelectedPhase] = useState(1)
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [viewMode, setViewMode] = useState('detailed') // 'detailed', 'comparison', 'summary'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([
      loadTeams(),
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

  const loadVotes = async () => {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('vote_type', 'slider')
    if (!error) setVotes(data || [])
  }

  // Calculate metric analytics for a specific team, phase, and metric
  const calculateMetricAnalytics = (teamId, phase, metricId) => {
    const phaseVotes = votes.filter(v => v.phase === phase)
    const scores = []

    phaseVotes.forEach(vote => {
      const scoreKey = `${teamId}-${metricId}`
      const score = vote.vote_data?.[scoreKey]
      if (score) {
        scores.push(score)
      }
    })

    const distribution = {
      5: scores.filter(s => s === 5).length,
      4: scores.filter(s => s === 4).length,
      3: scores.filter(s => s === 3).length,
      2: scores.filter(s => s === 2).length,
      1: scores.filter(s => s === 1).length
    }

    const total = scores.reduce((sum, score) => sum + score, 0)
    const average = scores.length > 0 ? (total / scores.length).toFixed(1) : 0
    const voteCount = scores.length

    return {
      scores,
      distribution,
      total,
      average,
      voteCount
    }
  }

  // Calculate all metrics for a team in a phase
  const calculateTeamPhaseAnalytics = (teamId, phase) => {
    const metrics = {}
    let totalPoints = 0

    METRICS.forEach(metric => {
      const analytics = calculateMetricAnalytics(teamId, phase, metric.id)
      metrics[metric.id] = analytics
      totalPoints += analytics.total
    })

    return {
      metrics,
      totalPoints,
      averageScore: METRICS.length > 0 ? (totalPoints / (METRICS.length * metrics[METRICS[0].id].voteCount || 1)).toFixed(1) : 0
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    const sliderPhases = PHASES.filter(p => p.type === 'slider')
    const headers = ['Team,Phase,Metric,Average,Total,5 Stars,4 Stars,3 Stars,2 Stars,1 Star,Total Votes']
    const rows = []

    teams.forEach(team => {
      sliderPhases.forEach(phase => {
        METRICS.forEach(metric => {
          const analytics = calculateMetricAnalytics(team.id, phase.id, metric.id)
          rows.push(
            `${team.name},${phase.name},${metric.name},${analytics.average},${analytics.total},` +
            `${analytics.distribution[5]},${analytics.distribution[4]},${analytics.distribution[3]},` +
            `${analytics.distribution[2]},${analytics.distribution[1]},${analytics.voteCount}`
          )
        })
      })
    })

    const csv = headers.concat(rows).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cibola-metric-analysis-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Render distribution bar
  const renderDistributionBar = (count, maxCount, color) => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
    return (
      <div className="flex items-center gap-2">
        <div className="w-24 bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full ${color} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-gray-700 w-8">{count}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-12 text-center border-4 border-sulphur">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    )
  }

  const sliderPhases = PHASES.filter(p => p.type === 'slider')
  const selectedPhaseInfo = sliderPhases.find(p => p.id === selectedPhase)

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ironwood flex items-center gap-3">
              <BarChart3 size={28} />
              Detailed Metric Analysis
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive breakdown of slider voting scores by team and metric
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="govt-button flex items-center gap-2"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phase Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Filter size={16} className="inline mr-1" />
              Select Phase
            </label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(parseInt(e.target.value))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:border-federal-blue focus:outline-none"
            >
              {sliderPhases.map(phase => (
                <option key={phase.id} value={phase.id}>
                  Phase {phase.id}: {phase.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              View Mode
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:border-federal-blue focus:outline-none"
            >
              <option value="detailed">Detailed Breakdown</option>
              <option value="comparison">Team Comparison</option>
              <option value="summary">Phase Summary</option>
            </select>
          </div>

          {/* Metric Filter (for comparison view) */}
          {viewMode === 'comparison' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Metric
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:border-federal-blue focus:outline-none"
              >
                <option value="all">All Metrics</option>
                {METRICS.map(metric => (
                  <option key={metric.id} value={metric.id}>
                    {metric.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Breakdown View */}
      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {teams.map(team => {
            const teamAnalytics = calculateTeamPhaseAnalytics(team.id, selectedPhase)

            return (
              <div key={team.id} className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-gray-300">
                <div className="bg-gradient-to-r from-federal-blue to-blue-900 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{team.name}</h3>
                      <p className="text-sm text-blue-100">{selectedPhaseInfo?.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-sulphur">
                        {teamAnalytics.totalPoints}
                      </div>
                      <div className="text-sm text-blue-100">Total Points</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {METRICS.map(metric => {
                    const analytics = teamAnalytics.metrics[metric.id]
                    const maxVotes = Math.max(...Object.values(analytics.distribution))

                    return (
                      <div key={metric.id} className="border-2 border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-ironwood">{metric.name}</h4>
                            <p className="text-xs text-gray-600 italic">"{metric.question}"</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-federal-blue">
                              {analytics.average}
                            </div>
                            <div className="text-xs text-gray-500">Average</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-50 rounded p-3">
                            <div className="text-xs font-semibold text-gray-600">Total Points</div>
                            <div className="text-xl font-bold text-green-600">{analytics.total}</div>
                          </div>
                          <div className="bg-gray-50 rounded p-3">
                            <div className="text-xs font-semibold text-gray-600">Vote Count</div>
                            <div className="text-xl font-bold text-purple-600">{analytics.voteCount}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-700 mb-2">Score Distribution:</div>
                          {[5, 4, 3, 2, 1].map(star => (
                            <div key={star} className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-700 w-20">
                                {star} {star === 1 ? 'star' : 'stars'}:
                              </span>
                              {renderDistributionBar(
                                analytics.distribution[star],
                                maxVotes,
                                star >= 4 ? 'bg-green-500' : star === 3 ? 'bg-yellow-500' : 'bg-red-500'
                              )}
                              <span className="text-xs text-gray-500">
                                {analytics.voteCount > 0 ? Math.round((analytics.distribution[star] / analytics.voteCount) * 100) : 0}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Comparison View */}
      {viewMode === 'comparison' && (
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-sulphur">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h3 className="text-2xl font-bold text-white">
              {selectedMetric === 'all' ? 'All Metrics' : METRICS.find(m => m.id === selectedMetric)?.name} - Team Comparison
            </h3>
            <p className="text-sm text-green-100">{selectedPhaseInfo?.name}</p>
          </div>

          <div className="p-6 overflow-x-auto">
            {selectedMetric === 'all' ? (
              // Show all metrics in separate tables
              <div className="space-y-6">
                {METRICS.map(metric => (
                  <div key={metric.id}>
                    <h4 className="text-lg font-bold text-ironwood mb-3">{metric.name}</h4>
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-gray-700 border">Team</th>
                          <th className="px-4 py-3 text-center font-bold text-gray-700 border">Avg</th>
                          <th className="px-4 py-3 text-center font-bold text-gray-700 border">Total</th>
                          <th className="px-4 py-3 text-center font-bold text-gray-700 border">5★</th>
                          <th className="px-4 py-3 text-center font-bold text-gray-700 border">4★</th>
                          <th className="px-4 py-3 text-center font-bold text-gray-700 border">3★</th>
                          <th className="px-4 py-3 text-center font-bold text-gray-700 border">2★</th>
                          <th className="px-4 py-3 text-center font-bold text-gray-700 border">1★</th>
                          <th className="px-4 py-3 text-center font-bold text-gray-700 border">Votes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teams.map(team => {
                          const analytics = calculateMetricAnalytics(team.id, selectedPhase, metric.id)
                          return (
                            <tr key={team.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900 border">{team.name}</td>
                              <td className="px-4 py-3 text-center font-bold text-federal-blue border">{analytics.average}</td>
                              <td className="px-4 py-3 text-center font-bold text-green-600 border">{analytics.total}</td>
                              <td className="px-4 py-3 text-center border">{analytics.distribution[5]}</td>
                              <td className="px-4 py-3 text-center border">{analytics.distribution[4]}</td>
                              <td className="px-4 py-3 text-center border">{analytics.distribution[3]}</td>
                              <td className="px-4 py-3 text-center border">{analytics.distribution[2]}</td>
                              <td className="px-4 py-3 text-center border">{analytics.distribution[1]}</td>
                              <td className="px-4 py-3 text-center font-semibold border">{analytics.voteCount}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              // Show single metric
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-gray-700 border">Team</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700 border">Avg</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700 border">Total</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700 border">5★</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700 border">4★</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700 border">3★</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700 border">2★</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700 border">1★</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-700 border">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => {
                    const analytics = calculateMetricAnalytics(team.id, selectedPhase, selectedMetric)
                    return (
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900 border">{team.name}</td>
                        <td className="px-4 py-3 text-center font-bold text-federal-blue border">{analytics.average}</td>
                        <td className="px-4 py-3 text-center font-bold text-green-600 border">{analytics.total}</td>
                        <td className="px-4 py-3 text-center border">{analytics.distribution[5]}</td>
                        <td className="px-4 py-3 text-center border">{analytics.distribution[4]}</td>
                        <td className="px-4 py-3 text-center border">{analytics.distribution[3]}</td>
                        <td className="px-4 py-3 text-center border">{analytics.distribution[2]}</td>
                        <td className="px-4 py-3 text-center border">{analytics.distribution[1]}</td>
                        <td className="px-4 py-3 text-center font-semibold border">{analytics.voteCount}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map(team => {
            const teamAnalytics = calculateTeamPhaseAnalytics(team.id, selectedPhase)

            // Calculate rank
            const allTeamScores = teams.map(t => ({
              id: t.id,
              score: calculateTeamPhaseAnalytics(t.id, selectedPhase).totalPoints
            }))
            const sortedScores = allTeamScores.sort((a, b) => b.score - a.score)
            const rank = sortedScores.findIndex(t => t.id === team.id) + 1

            return (
              <div key={team.id} className="bg-white rounded-lg shadow-xl border-4 border-gray-300 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{team.name}</h3>
                    <div className="flex items-center gap-2">
                      <Award className="text-yellow-300" size={20} />
                      <span className="text-lg font-bold text-yellow-300">Rank #{rank}</span>
                    </div>
                  </div>
                  <p className="text-sm text-purple-100">{selectedPhaseInfo?.name}</p>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    {METRICS.map(metric => {
                      const analytics = teamAnalytics.metrics[metric.id]
                      return (
                        <div key={metric.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                          <span className="font-semibold text-gray-700">{metric.name}:</span>
                          <div className="text-right">
                            <span className="text-lg font-bold text-federal-blue mr-2">{analytics.average}</span>
                            <span className="text-sm text-gray-500">avg</span>
                            <span className="text-sm text-gray-400 ml-2">({analytics.total} pts)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="bg-gradient-to-r from-sulphur to-yellow-500 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-ironwood">TOTAL:</span>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-ironwood">{teamAnalytics.totalPoints}</div>
                        <div className="text-sm text-gray-700">points</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-50 border-2 border-federal-blue rounded-lg p-6">
        <h3 className="font-bold text-federal-blue mb-3 flex items-center gap-2">
          <TrendingUp size={20} />
          About This Analysis
        </h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Score Distribution:</strong> Shows how many voters gave each rating (1-5 stars) for each metric.</p>
          <p><strong>Average:</strong> Mean score across all voters for that metric.</p>
          <p><strong>Total Points:</strong> Sum of all scores received for that metric.</p>
          <p><strong>Vote Count:</strong> Number of voters who scored this team on this metric.</p>
          <p className="text-xs text-gray-600 mt-3">Note: Only includes slider voting phases (1-3). Phase 4 ranked voting is shown in the Results tab.</p>
        </div>
      </div>
    </div>
  )
}
