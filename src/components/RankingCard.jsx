import React, { useState, useEffect } from 'react'
import { supabase, PHASES } from '../lib/supabase'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { GripVertical, AlertCircle, CheckCircle, Send } from 'lucide-react'

export default function RankingCard({
  voter,
  teams,
  phase,
  hasVoted,
  existingVote,
  onVoteComplete
}) {
  const [rankedTeams, setRankedTeams] = useState([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const phaseInfo = PHASES.find(p => p.id === phase)

  useEffect(() => {
    // Initialize teams (exclude voter's own team)
    const otherTeams = teams.filter(t => t.id !== voter.team_id)

    if (existingVote && existingVote.vote_data && existingVote.vote_data.rankings) {
      // Load existing rankings
      const rankings = existingVote.vote_data.rankings
      const orderedTeams = rankings.map(teamId =>
        otherTeams.find(t => t.id === teamId)
      ).filter(Boolean)
      setRankedTeams(orderedTeams)
    } else {
      // Initialize with unranked teams
      setRankedTeams(otherTeams)
    }
  }, [teams, voter.team_id, existingVote])

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(rankedTeams)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setRankedTeams(items)
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)

    try {
      // Validate all teams are ranked
      if (rankedTeams.length !== teams.length - 1) {
        setError('Please rank all teams before submitting.')
        setSubmitting(false)
        return
      }

      // Create rankings array (team IDs in order)
      const rankings = rankedTeams.map(t => t.id)

      // Generate confirmation number
      const confirmNum = `CPB-P${phase}-${voter.team_code}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

      // Submit vote
      const { error: voteError } = await supabase
        .from('votes')
        .upsert({
          voter_id: voter.voter_id,
          team_id: voter.team_id,
          phase: phase,
          vote_type: 'ranking',
          vote_data: { rankings: rankings },
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

  const getScoreForRank = (index) => {
    // 1st = 5pts, 2nd = 4pts, 3rd = 3pts, 4th = 2pts
    return 5 - index
  }

  if (showConfirmation) {
    return (
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-green-500">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-6 text-center">
          <CheckCircle className="mx-auto mb-4" size={64} />
          <h2 className="text-3xl font-serif font-bold mb-2">Ballot Submitted Successfully</h2>
          <p className="text-green-100">Your vote has been officially recorded</p>
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
              <p><strong>Teams Ranked:</strong> {rankedTeams.length}</p>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-federal-blue p-4 mb-6">
            <h4 className="font-bold text-federal-blue mb-2">Your Rankings</h4>
            <div className="space-y-2">
              {rankedTeams.map((team, index) => (
                <div key={team.id} className="flex items-center justify-between text-sm">
                  <span>
                    <strong>#{index + 1}</strong> - {team.name}
                  </span>
                  <span className="font-bold text-federal-blue">
                    {getScoreForRank(index)} points
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-yellow-800">
                <strong>Important:</strong> Your ballot has been cast and cannot be changed.
                Please save your confirmation number for your records.
              </div>
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
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-3xl font-serif font-bold mb-2">
            {phaseInfo?.name}
          </h2>
          <p className="text-blue-100">Rank the campaign teams in order of preference</p>
        </div>
      </div>

      {hasVoted && !showConfirmation && (
        <div className="bg-green-50 border-b-4 border-green-500 p-4">
          <div className="flex items-center justify-center gap-2 text-green-800">
            <CheckCircle size={20} />
            <span className="font-semibold">
              You have already voted for this phase. You can update your rankings below.
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
            <li>• <strong>Drag and drop</strong> the teams below to rank them from best to worst</li>
            <li>• <strong>1st place</strong> receives 5 points, <strong>2nd place</strong> receives 4 points, etc.</li>
            <li>• Your own team ({voter.team_name}) is <strong>excluded</strong> from ranking</li>
            <li>• Review your rankings carefully before submitting</li>
            <li>• Once submitted, you will receive an official confirmation number</li>
          </ul>
        </div>

        {/* Ranking Interface */}
        <div className="mb-6">
          <h3 className="font-bold text-ironwood mb-4 text-center text-lg">
            Rank the Teams (Drag to Reorder)
          </h3>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="teams">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-3 p-4 rounded-lg border-2 ${
                    snapshot.isDraggingOver
                      ? 'border-federal-blue bg-blue-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {rankedTeams.map((team, index) => (
                    <Draggable
                      key={team.id}
                      draggableId={team.id.toString()}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center gap-4 bg-white p-4 rounded-lg border-2 shadow-sm transition-all ${
                            snapshot.isDragging
                              ? 'border-federal-blue shadow-xl scale-105'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <GripVertical className="text-gray-400" size={24} />

                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sulphur text-ironwood font-bold text-xl">
                            {index + 1}
                          </div>

                          <div className="flex-1">
                            <div className="font-bold text-lg text-ironwood">
                              {team.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Team Code: {team.code}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-federal-blue">
                              {getScoreForRank(index)}
                            </div>
                            <div className="text-xs text-gray-500">points</div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
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
              <strong>Warning:</strong> Once you submit your ballot, your rankings will be
              officially recorded. You can update your vote later if needed, but each submission
              is logged with a timestamp.
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
