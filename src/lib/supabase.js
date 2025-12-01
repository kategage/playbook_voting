import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wbptrluqjmunknpdqsow.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHRybHVxam11bmtucGRxc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDE0MzksImV4cCI6MjA4MDAxNzQzOX0.li559TIkQ04PMgniPdEmC7ZNXtclmtZfUlZR9KBB9Lk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Phase configuration
export const PHASES = [
  { id: 1, name: 'THE LAUNCH', type: 'slider' },
  { id: 2, name: 'THE GOVERNANCE TEST', type: 'slider' },
  { id: 3, name: 'THE DATA BLACKOUT', type: 'slider' },
  { id: 4, name: 'THE FINAL ELECTION', type: 'ranking' }
]

// Metrics for slider-based phases (1-3)
export const METRICS = [
  {
    id: 'innovation',
    name: 'Innovation',
    question: 'Did they break the mold?',
    descriptions: {
      1: 'Not innovative: Conventional; existing campaign run today',
      2: 'Slightly innovative: Minor twist on familiar idea; still largely conventional',
      3: 'Moderately innovative: Fresh angle or creative element; noticeable but not bold',
      4: 'Highly innovative: Distinctive concept with clear originality; challenges norms',
      5: 'Reimagined: Bold, game-changing idea that redefines expectations'
    }
  },
  {
    id: 'feasibility',
    name: 'Feasibility',
    question: 'Is the budget/logistics real?',
    descriptions: {
      1: 'Not feasible: Budget unrealistic; major logistical/operational barriers',
      2: 'Low feasibility: Significant challenges; requires major resources or assumptions',
      3: 'Moderately feasible: Possible but requires tradeoffs, adjustments, or added resources',
      4: 'Highly feasible: Budget and logistics sound; minor risks but manageable',
      5: 'Fully feasible: Clear, practical, cost-realistic plan with no major obstacles'
    }
  },
  {
    id: 'impact',
    name: 'Impact',
    question: 'Would this actually move a voter?',
    descriptions: {
      1: 'No impact: Unlikely to influence voter awareness, opinion, or behavior',
      2: 'Low impact: Limited appeal; may resonate with small niche',
      3: 'Moderate impact: Has potential to persuade or motivate some target voters',
      4: 'High impact: Strong resonance; likely to move most voters in intended segment',
      5: 'Transformational impact: Compelling, memorable, highly persuasive; capable of shifting attitudes at scale'
    }
  }
]

// Database initialization script (run once)
export const initializeDatabase = async () => {
  try {
    // Check if tables exist by querying them
    const { data: teamsData } = await supabase.from('teams').select('*').limit(1)

    // If teams exist, database is already initialized
    if (teamsData && teamsData.length > 0) {
      console.log('Database already initialized')
      return { success: true, message: 'Database already initialized' }
    }

    // Initialize teams
    const teams = [
      { id: 1, name: 'Vega', code: 'NOVA47' },
      { id: 2, name: 'Spence', code: 'ORBIT92' },
      { id: 3, name: 'Sterling', code: 'COSMO38' },
      { id: 4, name: 'Strongbow', code: 'LUNAR65' },
      { id: 5, name: 'Thorne', code: 'ASTRO21' }
    ]

    const { error: teamsError } = await supabase.from('teams').insert(teams)
    if (teamsError && !teamsError.message.includes('duplicate')) {
      console.error('Error inserting teams:', teamsError)
    }

    // Initialize phase locks
    const phaseLocks = [
      { phase: 1, phase_name: 'THE LAUNCH', is_locked: false },
      { phase: 2, phase_name: 'THE GOVERNANCE TEST', is_locked: false },
      { phase: 3, phase_name: 'THE DATA BLACKOUT', is_locked: false },
      { phase: 4, phase_name: 'THE FINAL ELECTION', is_locked: false }
    ]

    const { error: locksError } = await supabase.from('phase_locks').upsert(phaseLocks)
    if (locksError) {
      console.error('Error inserting phase locks:', locksError)
    }

    console.log('Database initialized successfully')
    return { success: true, message: 'Database initialized successfully' }
  } catch (error) {
    console.error('Error initializing database:', error)
    return { success: false, error: error.message }
  }
}
