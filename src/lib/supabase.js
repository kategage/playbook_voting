import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wbptrluqjmunknpdqsow.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHRybHVxam11bmtucGRxc293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDE0MzksImV4cCI6MjA4MDAxNzQzOX0.li559TIkQ04PMgniPdEmC7ZNXtclmtZfUlZR9KBB9Lk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

    // Initialize round locks
    const roundLocks = [
      { round: 1, is_locked: false },
      { round: 2, is_locked: false },
      { round: 3, is_locked: false },
      { round: 4, is_locked: false }
    ]

    const { error: locksError } = await supabase.from('round_locks').upsert(roundLocks)
    if (locksError) {
      console.error('Error inserting round locks:', locksError)
    }

    // Initialize default criteria
    const criteria = [
      {
        id: 'creativity',
        name: 'Creativity',
        icon: '🎨',
        rounds: [1, 2, 3, 4],
        description: 'Originality and innovative thinking',
        display_order: 1,
        is_active: true
      },
      {
        id: 'effectiveness',
        name: 'Effectiveness',
        icon: '⚡',
        rounds: [1, 2, 3, 4],
        description: 'Impact and measurable results',
        display_order: 2,
        is_active: true
      },
      {
        id: 'adaptation',
        name: 'Adaptation',
        icon: '🔄',
        rounds: [4],
        description: 'Ability to adjust and improve based on feedback',
        display_order: 3,
        is_active: true
      }
    ]

    const { error: criteriaError } = await supabase.from('criteria').upsert(criteria)
    if (criteriaError) {
      console.error('Error inserting criteria:', criteriaError)
    }

    console.log('Database initialized successfully')
    return { success: true, message: 'Database initialized successfully' }
  } catch (error) {
    console.error('Error initializing database:', error)
    return { success: false, error: error.message }
  }
}
