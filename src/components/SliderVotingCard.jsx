import React, { useState, useEffect } from 'react'
import { supabase, METRICS, PHASES } from '../lib/supabase'
import { AlertCircle, CheckCircle, Send, Info, Lock, Unlock } from 'lucide-react'

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
  const [lockedTeams, setLockedTeams] = useState({})
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
    // Unlock team when score changes
    setLockedTeams(prev => ({
      ...prev,
      [teamId]: false
    }))
  }

  const toggleLock = (teamId) => {
    setLockedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }))
    setError('')
  }

  const handleSubmit = async () => {
    setError('')

    // Check if all teams are locked
    const unlockedTeams = otherTeams.filter(team => !lockedTeams[team.id])
    if (unlockedTeams.length > 0) {
      setError(`ERROR: You must lock in your scores for all teams before submitting. ${unlockedTeams.length} team(s) still unlocked: ${unlockedTeams.map(t => t.name).join(', ')}`)
      return
    }

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
            <li>• <strong className="text-red-600">Lock in your scores</strong> for each team before submitting</li>
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
          {otherTeams.map(team => {
            const isLocked = lockedTeams[team.id]
            return (
              <div
                key={team.id}
                className={`border-2 rounded-lg overflow-hidden transition-all ${
                  isLocked
                    ? 'border-green-500 shadow-lg shadow-green-200'
                    : getTeamColorClass(team.id, 'border')
                }`}
              >
                {/* Team Header */}
                <div className={`px-6 py-4 ${
                  isLocked
                    ? 'bg-gradient-to-r from-green-600 to-green-700'
                    : getTeamColorClass(team.id, 'header')
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                        isLocked ? 'bg-green-100 text-green-800' : getTeamColorClass(team.id, 'badge')
                      }`}>
                        {isLocked ? <Lock size={24} /> : team.name[0]}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{team.name}</h3>
                      </div>
                    </div>
                    {isLocked && (
                      <div className="flex items-center gap-2 bg-green-500 px-3 py-1 rounded-full">
                        <CheckCircle size={16} className="text-white" />
                        <span className="text-sm font-bold text-white">LOCKED</span>
                      </div>
                    )}
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
                        disabled={isLocked}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Lock Button */}
                <div className="mt-6 pt-6 border-t-2 border-gray-300">
                  <button
                    onClick={() => toggleLock(team.id)}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                      isLocked
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Unlock size={24} />
                        Unlock to Edit Scores
                      </>
                    ) : (
                      <>
                        <Lock size={24} />
                        Lock In Scores
                      </>
                    )}
                  </button>
                  {!isLocked && (
                    <p className="text-xs text-center text-gray-600 mt-2">
                      You must lock in your scores before you can submit your ballot
                    </p>
                  )}
                </div>
              </div>
            </div>
            )
          })}
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

        {/* Lock Status Summary */}
        <div className={`border-2 rounded-lg p-4 mb-6 ${
          Object.values(lockedTeams).filter(Boolean).length === otherTeams.length
            ? 'bg-green-50 border-green-500'
            : 'bg-yellow-50 border-yellow-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Object.values(lockedTeams).filter(Boolean).length === otherTeams.length ? (
                <>
                  <CheckCircle className="text-green-600" size={24} />
                  <span className="font-bold text-green-800">All teams locked! Ready to submit.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="text-yellow-600" size={24} />
                  <span className="font-bold text-yellow-800">Lock all teams before submitting</span>
                </>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">
                {Object.values(lockedTeams).filter(Boolean).length} / {otherTeams.length}
              </div>
              <div className="text-xs text-gray-600">Teams Locked</div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-blue-50 border-l-4 border-federal-blue p-4 mb-6">
          <div className="flex items-start gap-2">
            <Info className="text-federal-blue flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-gray-700">
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
