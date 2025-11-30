import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { BarChart3, Download, FileText, Award } from 'lucide-react'
import jsPDF from 'jspdf'

export default function ResultsTab() {
  const [teams, setTeams] = useState([])
  const [votes, setVotes] = useState([])
  const [criteria, setCriteria] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('all') // 'all', 'round', 'criterion'
  const [selectedRound, setSelectedRound] = useState(1)
  const [selectedCriterion, setSelectedCriterion] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([
      loadTeams(),
      loadVotes(),
      loadCriteria()
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

  const loadCriteria = async () => {
    const { data, error } = await supabase
      .from('criteria')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    if (!error) {
      setCriteria(data || [])
      if (data && data.length > 0) {
        setSelectedCriterion(data[0].id)
      }
    }
  }

  const calculateScores = (filterRound = null, filterCriterion = null) => {
    const scores = {}

    // Initialize scores for all teams
    teams.forEach(team => {
      scores[team.id] = {
        team: team,
        totalPoints: 0,
        breakdown: {}
      }
    })

    // Filter votes
    let filteredVotes = votes
    if (filterRound) {
      filteredVotes = filteredVotes.filter(v => v.round === filterRound)
    }
    if (filterCriterion) {
      filteredVotes = filteredVotes.filter(v => v.criterion === filterCriterion)
    }

    // Calculate points
    filteredVotes.forEach(vote => {
      const rankings = vote.rankings || []
      rankings.forEach((teamId, index) => {
        const points = 5 - index // 1st=5, 2nd=4, 3rd=3, 4th=2
        if (scores[teamId]) {
          scores[teamId].totalPoints += points

          // Track breakdown by criterion
          const key = `${vote.criterion}-R${vote.round}`
          if (!scores[teamId].breakdown[key]) {
            scores[teamId].breakdown[key] = 0
          }
          scores[teamId].breakdown[key] += points
        }
      })
    })

    // Sort by total points
    return Object.values(scores).sort((a, b) => b.totalPoints - a.totalPoints)
  }

  const exportToCSV = () => {
    const results = calculateScores()

    let csv = 'Rank,Team,Total Points\n'
    results.forEach((result, index) => {
      csv += `${index + 1},${result.team.name},${result.totalPoints}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cibola-election-results-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const results = calculateScores()

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('State of Cibola', 105, 20, { align: 'center' })

    doc.setFontSize(16)
    doc.text('Campaign Playbook Election Results', 105, 30, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text('Ex Igne, Aurum', 105, 38, { align: 'center' })

    // Date
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 48, { align: 'center' })

    // Results
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Official Results', 20, 65)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    let y = 80
    results.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''
      doc.text(`${index + 1}. ${result.team.name}: ${result.totalPoints} points ${medal}`, 30, y)
      y += 10
    })

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('State of Cibola Election Commission • Founded 2026', 105, 280, { align: 'center' })
    doc.text('cibola2028@cooperativeimpactlab.org', 105, 285, { align: 'center' })

    doc.save(`cibola-election-results-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-12 text-center border-4 border-sulphur">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-federal-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Loading results...</p>
      </div>
    )
  }

  const results = viewMode === 'all'
    ? calculateScores()
    : viewMode === 'round'
    ? calculateScores(selectedRound, null)
    : calculateScores(null, selectedCriterion)

  return (
    <div className="space-y-6">
      {/* View Controls */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-4 border-sulphur">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-ironwood">Results View</h2>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold"
            >
              <Download size={18} />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-semibold"
            >
              <FileText size={18} />
              Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setViewMode('all')}
            className={`p-3 rounded-lg border-2 transition-all ${
              viewMode === 'all'
                ? 'border-federal-blue bg-federal-blue text-white font-bold'
                : 'border-gray-300 bg-white hover:border-federal-blue'
            }`}
          >
            All Rounds & Criteria
          </button>
          <button
            onClick={() => setViewMode('round')}
            className={`p-3 rounded-lg border-2 transition-all ${
              viewMode === 'round'
                ? 'border-federal-blue bg-federal-blue text-white font-bold'
                : 'border-gray-300 bg-white hover:border-federal-blue'
            }`}
          >
            By Round
          </button>
          <button
            onClick={() => setViewMode('criterion')}
            className={`p-3 rounded-lg border-2 transition-all ${
              viewMode === 'criterion'
                ? 'border-federal-blue bg-federal-blue text-white font-bold'
                : 'border-gray-300 bg-white hover:border-federal-blue'
            }`}
          >
            By Criterion
          </button>
        </div>

        {viewMode === 'round' && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(round => (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                className={`p-2 rounded border ${
                  selectedRound === round
                    ? 'border-sulphur bg-cream font-bold'
                    : 'border-gray-300 bg-white'
                }`}
              >
                Round {round}
              </button>
            ))}
          </div>
        )}

        {viewMode === 'criterion' && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {criteria.map(criterion => (
              <button
                key={criterion.id}
                onClick={() => setSelectedCriterion(criterion.id)}
                className={`p-2 rounded border ${
                  selectedCriterion === criterion.id
                    ? 'border-sulphur bg-cream font-bold'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {criterion.icon} {criterion.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Display */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border-4 border-sulphur">
        <div className="bg-gradient-to-r from-sulphur to-yellow-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-ironwood" size={28} />
            <div>
              <h2 className="text-2xl font-serif font-bold text-ironwood">
                Official Tabulation
              </h2>
              <p className="text-sm text-gray-700">
                {viewMode === 'all' && 'Aggregate Results Across All Rounds & Criteria'}
                {viewMode === 'round' && `Round ${selectedRound} Results`}
                {viewMode === 'criterion' && `${criteria.find(c => c.id === selectedCriterion)?.name} Results`}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''
                const medalBg = index === 0 ? 'bg-yellow-100 border-yellow-400' :
                               index === 1 ? 'bg-gray-100 border-gray-400' :
                               index === 2 ? 'bg-orange-100 border-orange-400' :
                               'bg-white border-gray-300'

                return (
                  <div
                    key={result.team.id}
                    className={`border-2 rounded-lg p-6 ${medalBg} transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold text-gray-400 w-12">
                          #{index + 1}
                        </div>
                        {medal && <div className="text-5xl">{medal}</div>}
                        <div>
                          <h3 className="text-2xl font-bold text-ironwood">
                            {result.team.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Team Code: {result.team.code}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-5xl font-bold text-federal-blue">
                          {result.totalPoints}
                        </div>
                        <div className="text-sm text-gray-600">total points</div>
                      </div>
                    </div>

                    {/* Point Breakdown */}
                    {Object.keys(result.breakdown).length > 0 && (
                      <div className="mt-4 pt-4 border-t-2 border-gray-300">
                        <details className="text-sm">
                          <summary className="cursor-pointer font-semibold text-gray-700 hover:text-federal-blue">
                            View Point Breakdown
                          </summary>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(result.breakdown).map(([key, points]) => (
                              <div key={key} className="bg-white p-2 rounded border border-gray-200">
                                <div className="text-xs text-gray-600">{key}</div>
                                <div className="font-bold text-federal-blue">{points} pts</div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Award className="mx-auto mb-3 text-gray-400" size={48} />
              <p>No results available yet. Votes will appear here as they are submitted.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
