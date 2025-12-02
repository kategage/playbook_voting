import React, { useState, useEffect } from 'react'
import { supabase, METRICS, PHASES } from '../lib/supabase'
import { AlertCircle, CheckCircle, Send, Info } from 'lucide-react'

// Team color utility function
const getTeamColorClass = (teamId, type = 'header') => {
  const colors = {
    1: { // Vega - Blue
      header: 'bg-gradient-to-r from-blue-600 to-blue-700',
      badge: 'bg-blue-100 text-blue-800',
      border: 'border-blue-500'
    },
    2: { // Spence - Green
      header: 'bg-gradient-to-r from-green-600 to-green-700',
      badge: 'bg-green-100 text-green-800',
      border: 'border-green-500'
    },
    3: { // Sterling - Purple
      header: 'bg-gradient-to-r from-purple-600 to-purple-700',
      badge: 'bg-purple-100 text-purple-800',
      border: 'border-purple-500'
    },
    4: { // Strongbow - Orange
      header: 'bg-gradient-to-r from-orange-600 to-orange-700',
      badge: 'bg-orange-100 text-orange-800',
      border: 'border-orange-500'
    },
    5: { // Thorne - Rose/Pink
      header: 'bg-gradient-to-r from-rose-600 to-rose-700',
      badge: 'bg-rose-100 text-rose-800',
      border: 'border-rose-500'
    }
  }
  return colors[teamId]?.[type] || colors[1][type]
}

export default function SliderVotingCard({
  voter,
  teams,
  phase,
  hasVoted,
  existingVote,
  onVoteComplete
}) {
  const [scores, setScores] = useState({})
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [expandedMetric, setExpandedMetric] = useState(null)

  const phaseInfo = PHASES.find(p => p.id === phase)
  const otherTeams = teams.filter(t => t.id !== voter.team_id)

  useEffect(() => {
    // Initialize scores for all teams/metrics
    const initialScores = {}

    if (existingVote && existingVote.vote_data) {
      // Load existing scores
      setScores(existingVote.vote_data)
    } else {
      // Initialize with default value of 2 (middle of 1-4 scale)
      otherTeams.forEach(team => {
        METRICS.forEach(metric => {
          initialScores[`${team.id}-${metric.id}`] = 2
        })
      })
      setScores(initialScores)
    }
  }, [teams, voter.team_id, existingVote])

  const handleSliderChange = (teamId, metricId, value) => {
    setScores(prev => ({
      ...prev,
      [`${teamId}-${metricId}`]: parseInt(value)
    }))
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)

    try {
      // Generate confirmation number
      const confirmNum = `CPB-P${phase}-${voter.team_code}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

      // Submit vote
      const { error: voteError } = await supabase
        .from('votes')
        .upsert({
          voter_id: voter.voter_id,
          team_id: voter.team_id,
          phase: phase,
          vote_type: 'slider',
          vote_data: scores,
          timestamp: new Date().toISOString()
        }, {
          onConflict: 'voter_id,phase'
        })

      if (voteError) throw voteError

      setConfirmationNumber(confirmNum)
      setShowConfirmation(true)
      onVoteComplete()
    } catch (error) {
      console.error('Error submitting vote:', error)
      setError('Failed to submit vote. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (showConfirmation) {
    return (
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-green-500">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-6 text-center">
          <CheckCircle className="mx-auto mb-4" size={64} />
          <h2 className="text-3xl font-serif font-bold mb-2">Ballot Submitted Successfully</h2>
          <p className="text-green-100">Your scores have been officially recorded</p>
        </div>

        <div className="p-8">
          <div className="bg-cream border-4 border-sulphur rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
              <div className="text-sm font-semibold text-gray-600 mb-2">
                OFFICIAL CONFIRMATION NUMBER
              </div>
              <div className="text-3xl font-bold font-mono text-federal-blue">
                {confirmationNumber}
              </div>
            </div>
            <div className="border-t-2 border-sulphur pt-4 text-center text-sm text-gray-700">
              <p><strong>Phase:</strong> {phaseInfo?.name}</p>
              <p><strong>Voter:</strong> {voter.name} ({voter.team_name})</p>
              <p><strong>Teams Evaluated:</strong> {otherTeams.length}</p>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmation(false)}
            className="w-full govt-button"
          >
            Return to Voting
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-sulphur">
      <div className="bg-gradient-to-r from-federal-blue to-blue-900 text-white px-8 py-6">
        <div className="text-center">
          <div className="text-5xl mb-3">📊</div>
          <h2 className="text-3xl font-serif font-bold mb-2">
            {phaseInfo?.name}
          </h2>
          <p className="text-blue-100">Evaluate each team on three key metrics</p>
        </div>
      </div>

      {hasVoted && !showConfirmation && (
        <div className="bg-green-50 border-b-4 border-green-500 p-4">
          <div className="flex items-center justify-center gap-2 text-green-800">
            <CheckCircle size={20} />
            <span className="font-semibold">
              You have already voted for this phase. You can update your scores below.
            </span>
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Instructions */}
        <div className="bg-cream border-2 border-sulphur rounded-lg p-6 mb-6">
          <h3 className="font-bold text-ironwood mb-3 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Voting Instructions
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Evaluate the {otherTeams.length} other teams</strong> on three metrics (your team is excluded)</li>
            <li>• <strong>Use the sliders</strong> to rate each team from 1 (lowest) to 4 (highest)</li>
            <li>• <strong>Review the descriptions</strong> for each rating level to ensure accuracy</li>
            <li>• <strong>Submit all scores</strong> at once when you're ready</li>
          </ul>
        </div>

        {/* Metrics Reference */}
        <div className="bg-blue-50 border-2 border-federal-blue rounded-lg p-4 mb-6">
          <h4 className="font-bold text-federal-blue mb-3 flex items-center gap-2">
            <Info size={20} />
            Evaluation Metrics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {METRICS.map(metric => (
              <div key={metric.id} className="bg-white p-3 rounded border border-gray-300">
                <div className="font-bold text-ironwood mb-1">{metric.name}</div>
                <div className="text-xs text-gray-600 italic">"{metric.question}"</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Scoring */}
        <div className="space-y-6 mb-6">
          {otherTeams.map(team => (
            <div
              key={team.id}
              className={`border-2 rounded-lg overflow-hidden transition-colors ${getTeamColorClass(team.id, 'border')}`}
            >
              {/* Team Header */}
              <div className={`px-6 py-4 ${getTeamColorClass(team.id, 'header')}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${getTeamColorClass(team.id, 'badge')}`}>
                    {team.name[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{team.name}</h3>
                  </div>
                </div>
              </div>

              {/* Metrics Sliders */}
              <div className="p-6 space-y-6 bg-gray-50">
                {METRICS.map(metric => {
                  const scoreKey = `${team.id}-${metric.id}`
                  const score = scores[scoreKey] || 2
                  const isExpanded = expandedMetric === scoreKey

                  return (
                    <div key={metric.id} className="bg-white p-4 rounded-lg border-2 border-gray-200">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-ironwood">{metric.name}</h4>
                            <p className="text-xs text-gray-600 italic">"{metric.question}"</p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-federal-blue">{score}</div>
                            <div className="text-xs text-gray-500">out of 4</div>
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedMetric(isExpanded ? null : scoreKey)}
                          className="text-xs text-federal-blue hover:underline"
                        >
                          {isExpanded ? 'Hide' : 'Show'} rating descriptions
                        </button>
                      </div>

                      {/* Slider */}
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={score}
                        onChange={(e) => handleSliderChange(team.id, metric.id, e.target.value)}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #1e3a8a 0%, #1e3a8a ${((score - 1) / 3) * 100}%, #e5e7eb ${((score - 1) / 3) * 100}%, #e5e7eb 100%)`
                        }}
                      />

                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                      </div>

                      {/* Description for current score */}
                      <div className="mt-3 p-3 bg-cream rounded border border-sulphur">
                        <p className="text-sm text-gray-700">
                          <strong>{score}:</strong> {metric.descriptions[score]}
                        </p>
                      </div>

                      {/* Expanded descriptions */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-gray-100 rounded border border-gray-300 space-y-2">
                          {[1, 2, 3, 4].map(level => (
                            <div key={level} className={`text-xs ${score === level ? 'font-bold text-federal-blue' : 'text-gray-600'}`}>
                              <strong>{level}:</strong> {metric.descriptions[level]}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> Once you submit your scores, they will be officially recorded.
              You can update your scores later if needed, but each submission is logged with a timestamp.
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full govt-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg py-4"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              Submitting Official Ballot...
            </>
          ) : (
            <>
              <Send size={24} />
              Submit Official Ballot
            </>
          )}
        </button>
      </div>
    </div>
  )
}
