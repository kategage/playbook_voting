import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Lock, Unlock, Shield } from 'lucide-react'

export default function RoundLockManager() {
  const [roundLocks, setRoundLocks] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoundLocks()

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

  const loadRoundLocks = async () => {
    try {
      const { data, error } = await supabase
        .from('round_locks')
        .select('*')
        .order('round')

      if (error) throw error

      const locks = {}
      data?.forEach(lock => {
        locks[lock.round] = lock.is_locked
      })
      setRoundLocks(locks)
    } catch (error) {
      console.error('Error loading round locks:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRoundLock = async (round) => {
    try {
      const newLockState = !roundLocks[round]

      const { error } = await supabase
        .from('round_locks')
        .update({ is_locked: newLockState })
        .eq('round', round)

      if (error) throw error

      setRoundLocks(prev => ({
        ...prev,
        [round]: newLockState
      }))
    } catch (error) {
      console.error('Error toggling round lock:', error)
      alert('Failed to toggle round lock.')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 border-4 border-sulphur">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-federal-blue mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-sulphur">
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <Shield className="text-white" size={28} />
          <div>
            <h2 className="text-2xl font-serif font-bold text-white">
              Round Lock Controls
            </h2>
            <p className="text-sm text-red-100">
              Lock or unlock voting rounds to control access
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(round => {
            const isLocked = roundLocks[round]
            return (
              <div
                key={round}
                className={`border-2 rounded-lg p-6 transition-all ${
                  isLocked
                    ? 'border-red-500 bg-red-50'
                    : 'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isLocked ? (
                      <Lock className="text-red-600" size={32} />
                    ) : (
                      <Unlock className="text-green-600" size={32} />
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Round {round}
                      </h3>
                      <p className={`text-sm font-semibold ${
                        isLocked ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {isLocked ? '🔒 Locked' : '🔓 Open'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4">
                  {isLocked
                    ? 'Voting is currently disabled for this round. Voters cannot submit or update ballots.'
                    : 'Voting is currently enabled for this round. Voters can submit and update ballots.'}
                </p>

                <button
                  onClick={() => toggleRoundLock(round)}
                  className={`w-full px-4 py-3 rounded-md font-semibold transition-colors ${
                    isLocked
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isLocked ? 'Unlock Round' : 'Lock Round'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
