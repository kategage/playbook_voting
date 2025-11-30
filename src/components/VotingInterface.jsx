import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import RankingCard from './RankingCard'
import { AlertTriangle, CheckCircle2, Lock, Unlock } from 'lucide-react'

export default function VotingInterface({ voter, teams, onVoteSubmitted }) {
  const [selectedRound, setSelectedRound] = useState(1)
  const [selectedCriterion, setSelectedCriterion] = useState(null)
  const [criteria, setCriteria] = useState([])
  const [roundLocks, setRoundLocks] = useState({})
  const [existingVotes, setExistingVotes] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCriteria()
    loadRoundLocks()
    loadExistingVotes()

    // Subscribe to round lock changes
    const subscription = supabase
      .channel('round_locks_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'round_locks'
      }, () => {
        loadRoundLocks()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    loadExistingVotes()
  }, [voter.voter_id])

  const loadCriteria = async () => {
    try {
      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error
      setCriteria(data || [])

      // Set first criterion for selected round as default
      const firstCriterion = data?.find(c => c.rounds.includes(selectedRound))
      if (firstCriterion) {
        setSelectedCriterion(firstCriterion.id)
      }
    } catch (error) {
      console.error('Error loading criteria:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRoundLocks = async () => {
    try {
      const { data, error } = await supabase
        .from('round_locks')
        .select('*')

      if (error) throw error

      const locks = {}
      data?.forEach(lock => {
        locks[lock.round] = lock.is_locked
      })
      setRoundLocks(locks)
    } catch (error) {
      console.error('Error loading round locks:', error)
    }
  }

  const loadExistingVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('voter_id', voter.voter_id)

      if (error) throw error

      const votes = {}
      data?.forEach(vote => {
        const key = `${vote.round}-${vote.criterion}`
        votes[key] = vote
      })
      setExistingVotes(votes)
    } catch (error) {
      console.error('Error loading existing votes:', error)
    }
  }

  const handleRoundChange = (round) => {
    setSelectedRound(round)
    // Select first available criterion for this round
    const firstCriterion = criteria.find(c => c.rounds.includes(round))
    if (firstCriterion) {
      setSelectedCriterion(firstCriterion.id)
    }
  }

  const handleVoteComplete = async () => {
    await loadExistingVotes()
    onVoteSubmitted()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-12 text-center border-4 border-sulphur">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Loading voting interface...</p>
      </div>
    )
  }

  // Filter criteria for selected round
  const roundCriteria = criteria.filter(c => c.rounds.includes(selectedRound))
  const currentCriterion = criteria.find(c => c.id === selectedCriterion)
  const isRoundLocked = roundLocks[selectedRound]
  const voteKey = `${selectedRound}-${selectedCriterion}`
  const hasVoted = !!existingVotes[voteKey]

  return (
    <div className="space-y-6">
      {/* Round Selection */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
        <h2 className="text-2xl font-serif font-bold text-ironwood mb-4 text-center">
          Select Assessment Round
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((round) => {
            const isLocked = roundLocks[round]
            const roundCriteriaCount = criteria.filter(c => c.rounds.includes(round)).length
            const votedCount = criteria.filter(c =>
              c.rounds.includes(round) && existingVotes[`${round}-${c.id}`]
            ).length

            return (
              <button
                key={round}
                onClick={() => handleRoundChange(round)}
                disabled={isLocked}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRound === round
                    ? 'border-federal-blue bg-federal-blue text-white shadow-lg transform scale-105'
                    : isLocked
                    ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 bg-white hover:border-federal-blue hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">Round {round}</span>
                  {isLocked ? (
                    <Lock size={18} className="text-red-500" />
                  ) : (
                    <Unlock size={18} className="text-green-500" />
                  )}
                </div>
                <div className="text-sm">
                  {votedCount}/{roundCriteriaCount} voted
                </div>
                {votedCount === roundCriteriaCount && roundCriteriaCount > 0 && (
                  <div className="mt-2 text-green-400">✅ Complete</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Criterion Selection */}
      {roundCriteria.length > 0 && (
        <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
          <h3 className="text-xl font-serif font-bold text-ironwood mb-4 text-center">
            Select Assessment Criterion
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roundCriteria.map((criterion) => {
              const voted = !!existingVotes[`${selectedRound}-${criterion.id}`]

              return (
                <button
                  key={criterion.id}
                  onClick={() => setSelectedCriterion(criterion.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCriterion === criterion.id
                      ? 'border-sulphur bg-cream shadow-lg transform scale-105'
                      : 'border-gray-300 bg-white hover:border-sulphur hover:shadow-md'
                  }`}
                >
                  <div className="text-3xl mb-2">{criterion.icon}</div>
                  <div className="font-bold text-ironwood mb-1">{criterion.name}</div>
                  <div className="text-xs text-gray-600 mb-2">{criterion.description}</div>
                  {voted && (
                    <div className="flex items-center justify-center gap-1 text-green-600 text-sm font-semibold">
                      <CheckCircle2 size={16} />
                      Voted
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Voting Area */}
      {isRoundLocked ? (
        <div className="bg-red-50 border-4 border-red-500 rounded-lg p-8 text-center">
          <Lock className="text-red-600 mx-auto mb-4" size={48} />
          <h3 className="text-2xl font-bold text-red-800 mb-2">Round {selectedRound} Locked</h3>
          <p className="text-red-700">
            This voting round has been closed by election officials. Please select another round.
          </p>
        </div>
      ) : currentCriterion ? (
        <RankingCard
          voter={voter}
          teams={teams}
          round={selectedRound}
          criterion={currentCriterion}
          hasVoted={hasVoted}
          existingVote={existingVotes[voteKey]}
          onVoteComplete={handleVoteComplete}
        />
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 text-center border-2 border-gray-300">
          <AlertTriangle className="text-gray-400 mx-auto mb-4" size={48} />
          <p className="text-gray-600">No criteria available for Round {selectedRound}</p>
        </div>
      )}
    </div>
  )
}
