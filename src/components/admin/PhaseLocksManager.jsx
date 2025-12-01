import React, { useState, useEffect } from 'react'
import { supabase, PHASES } from '../../lib/supabase'
import { Lock, Unlock, Shield } from 'lucide-react'

export default function PhaseLocksManager() {
  const [phaseLocks, setPhaseLocks] = useState({})
  const [phaseNames, setPhaseNames] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPhaseLocks()

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

  const togglePhaseLock = async (phase) => {
    try {
      const newLockState = !phaseLocks[phase]

      const { error } = await supabase
        .from('phase_locks')
        .update({ is_locked: newLockState })
        .eq('phase', phase)

      if (error) throw error

      setPhaseLocks(prev => ({
        ...prev,
        [phase]: newLockState
      }))
    } catch (error) {
      console.error('Error toggling phase lock:', error)
      alert('Failed to toggle phase lock.')
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
              Phase Lock Controls
            </h2>
            <p className="text-sm text-red-100">
              Lock or unlock voting phases to control access
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(phase => {
            const isLocked = phaseLocks[phase]
            const phaseInfo = PHASES.find(p => p.id === phase)
            const phaseName = phaseNames[phase] || phaseInfo?.name || `Phase ${phase}`

            return (
              <div
                key={phase}
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
                        Phase {phase}
                      </h3>
                      <p className="text-sm font-bold text-ironwood">
                        {phaseName}
                      </p>
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
                    ? 'Voting is currently disabled for this phase. Voters cannot submit or update ballots.'
                    : 'Voting is currently enabled for this phase. Voters can submit and update ballots.'}
                </p>

                <button
                  onClick={() => togglePhaseLock(phase)}
                  className={`w-full px-4 py-3 rounded-md font-semibold transition-colors ${
                    isLocked
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isLocked ? 'Unlock Phase' : 'Lock Phase'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
