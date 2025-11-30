import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shield, AlertCircle } from 'lucide-react'

export default function VoterAuth({ onLogin, teams }) {
  const [teamCode, setTeamCode] = useState('')
  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate team code
      const team = teams.find(t => t.code.toUpperCase() === teamCode.toUpperCase())
      if (!team) {
        setError('Invalid team code. Please check your code and try again.')
        setLoading(false)
        return
      }

      if (!firstName.trim()) {
        setError('Please enter your first name.')
        setLoading(false)
        return
      }

      // Generate voter ID
      const voterId = `${team.code}-${firstName.toUpperCase()}-${Date.now().toString().slice(-6)}`

      // Check if voter already exists
      const { data: existingVoter, error: checkError } = await supabase
        .from('voters')
        .select('*')
        .eq('name', firstName.trim())
        .eq('team_id', team.id)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      let voterData
      if (existingVoter) {
        // Use existing voter
        voterData = {
          voter_id: existingVoter.voter_id,
          name: existingVoter.name,
          team_id: existingVoter.team_id,
          team_name: team.name,
          team_code: team.code
        }
      } else {
        // Create new voter
        const { data: newVoter, error: insertError } = await supabase
          .from('voters')
          .insert({
            voter_id: voterId,
            name: firstName.trim(),
            team_id: team.id
          })
          .select()
          .single()

        if (insertError) throw insertError

        voterData = {
          voter_id: newVoter.voter_id,
          name: newVoter.name,
          team_id: newVoter.team_id,
          team_name: team.name,
          team_code: team.code
        }
      }

      onLogin(voterData)
    } catch (error) {
      console.error('Authentication error:', error)
      setError('An error occurred during authentication. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-sulphur">
        {/* Header */}
        <div className="bg-gradient-to-r from-federal-blue to-blue-900 text-white px-8 py-8 text-center">
          <div className="w-20 h-20 bg-sulphur rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            🗳️
          </div>
          <h2 className="text-3xl font-serif font-bold mb-2">
            Official Voter Authentication
          </h2>
          <p className="text-sm opacity-90">
            State of Cibola Campaign Playbook Election Portal
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-cream border-b-4 border-sulphur p-6">
          <div className="flex items-start gap-3">
            <Shield className="text-federal-blue mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-ironwood mb-2">Voter Eligibility Requirements</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• You must have a valid team access code provided by your campaign team</li>
                <li>• Enter your first name exactly as registered with your team</li>
                <li>• Your credentials will be saved for the duration of this voting session</li>
                <li>• Each voter may cast one ballot per round per criterion</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            {/* Team Code Input */}
            <div>
              <label htmlFor="teamCode" className="block text-sm font-bold text-ironwood mb-2">
                Team Access Code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="teamCode"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="e.g., NOVA47"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:border-federal-blue focus:outline-none text-lg font-mono uppercase"
                required
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the unique code provided to your campaign team
              </p>
            </div>

            {/* First Name Input */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-bold text-ironwood mb-2">
                First Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:border-federal-blue focus:outline-none text-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Must match your registered name with your campaign team
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full govt-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Authenticate & Enter Portal
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="bg-gray-100 px-8 py-4 border-t-2 border-gray-300">
          <p className="text-xs text-gray-600 text-center">
            🔒 This is a secure election portal. Your authentication credentials will be stored
            locally on your device for the duration of this voting session.
          </p>
        </div>
      </div>

      {/* Team Codes Reference */}
      <div className="mt-6 bg-white rounded-lg shadow-lg p-6 border-2 border-gray-300">
        <h3 className="font-serif font-bold text-ironwood mb-4 text-center">
          Registered Campaign Teams
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {teams.map((team) => (
            <div key={team.id} className="bg-cream p-3 rounded border-2 border-sulphur text-center">
              <div className="font-bold text-ironwood">{team.name}</div>
              <div className="text-xs text-gray-600 font-mono">{team.code}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center mt-4">
          If you don't have a team code, please contact your campaign coordinator
        </p>
      </div>
    </div>
  )
}
