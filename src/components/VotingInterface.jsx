import React, { useState, useEffect } from 'react'
import { supabase, PHASES } from '../lib/supabase'
import SliderVotingCard from './SliderVotingCard'
import RankingCard from './RankingCard'
import { AlertTriangle, CheckCircle2, Lock, Unlock } from 'lucide-react'

export default function VotingInterface({ voter, teams, onVoteSubmitted }) {
  const [selectedPhase, setSelectedPhase] = useState(1)
  const [phaseLocks, setPhaseLocks] = useState({})
  const [phaseNames, setPhaseNames] = useState({})
  const [existingVotes, setExistingVotes] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPhaseLocks()
    loadExistingVotes()

    // Subscribe to phase lock changes
    const subscription = supabase
      .channel('phase_locks_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'phase_locks'
      }, () => {
        loadPhaseLocks()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    loadExistingVotes()
  }, [voter.voter_id])

  const loadPhaseLocks = async () => {
    try {
      const { data, error } = await supabase
        .from('phase_locks')
        .select('*')
        .order('phase')

      if (error) throw error

      const locks = {}
      const names = {}
      data?.forEach(lock => {
        locks[lock.phase] = lock.is_locked
        names[lock.phase] = lock.phase_name
      })
      setPhaseLocks(locks)
      setPhaseNames(names)
    } catch (error) {
      console.error('Error loading phase locks:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExistingVotes = async () => {
    try {
      const { data, error} = await supabase
        .from('votes')
        .select('*')
        .eq('voter_id', voter.voter_id)

      if (error) throw error

      const votes = {}
      data?.forEach(vote => {
        votes[vote.phase] = vote
      })
      setExistingVotes(votes)
    } catch (error) {
      console.error('Error loading existing votes:', error)
    }
  }

  const handleVoteComplete = async () => {
    await loadExistingVotes()
    onVoteSubmitted()
  }

  // Phase visibility: only show phases that are unlocked OR already have votes
  const getUnlockedPhases = () => {
    const unlocked = []
    for (let phase = 1; phase <= 4; phase++) {
      if (phaseLocks[phase] === false || existingVotes[phase]) {
        unlocked.push(phase)
      } else {
        // Stop at first locked phase that hasn't been voted on
        break
      }
    }
    return unlocked
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-12 text-center border-4 border-sulphur">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Loading voting interface...</p>
      </div>
    )
  }

  const currentPhaseInfo = PHASES.find(p => p.id === selectedPhase)
  const isPhaseLocked = phaseLocks[selectedPhase]
  const hasVoted = !!existingVotes[selectedPhase]
  const unlockedPhases = getUnlockedPhases()

  return (
    <div className="space-y-6">
      {/* Phase Selection */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
        <h2 className="text-2xl font-serif font-bold text-ironwood mb-4 text-center">
          Select Assessment Phase
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((phase) => {
            const isLocked = phaseLocks[phase]
            const hasVotedPhase = !!existingVotes[phase]
            const phaseInfo = PHASES.find(p => p.id === phase)
            const isVisible = unlockedPhases.includes(phase)

            // Don't show locked phases that haven't been voted on
            if (!isVisible) {
              return (
                <div
                  key={phase}
                  className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-400">Phase {phase}</span>
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-400">Not yet available</div>
                </div>
              )
            }

            return (
              <button
                key={phase}
                onClick={() => setSelectedPhase(phase)}
                disabled={isLocked && !hasVotedPhase}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPhase === phase
                    ? 'border-federal-blue bg-federal-blue text-white shadow-lg transform scale-105'
                    : isLocked && !hasVotedPhase
                    ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 bg-white hover:border-federal-blue hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">Phase {phase}</span>
                  {isLocked ? (
                    <Lock size={18} className="text-red-500" />
                  ) : (
                    <Unlock size={18} className="text-green-500" />
                  )}
                </div>
                <div className="text-xs mb-1 font-semibold">
                  {phaseNames[phase] || phaseInfo?.name || `Phase ${phase}`}
                </div>
                <div className="text-sm">
                  {hasVotedPhase ? '✅ Voted' : '⏳ Pending'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Voting Area */}
      {isPhaseLocked && !hasVoted ? (
        <div className="bg-red-50 border-4 border-red-500 rounded-lg p-8 text-center">
          <Lock className="text-red-600 mx-auto mb-4" size={48} />
          <h3 className="text-2xl font-bold text-red-800 mb-2">Phase {selectedPhase} Locked</h3>
          <p className="text-red-700">
            This voting phase has been closed by election officials. Please select another phase.
          </p>
        </div>
      ) : currentPhaseInfo ? (
        currentPhaseInfo.type === 'slider' ? (
          <SliderVotingCard
            voter={voter}
            teams={teams}
            phase={selectedPhase}
            hasVoted={hasVoted}
            existingVote={existingVotes[selectedPhase]}
            onVoteComplete={handleVoteComplete}
          />
        ) : (
          <RankingCard
            voter={voter}
            teams={teams}
            phase={selectedPhase}
            hasVoted={hasVoted}
            existingVote={existingVotes[selectedPhase]}
            onVoteComplete={handleVoteComplete}
          />
        )
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 text-center border-2 border-gray-300">
          <AlertTriangle className="text-gray-400 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Invalid phase selected</p>
        </div>
      )}
    </div>
  )
}
