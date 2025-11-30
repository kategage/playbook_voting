# State of Cibola Election Portal

**"Ex Igne, Aurum" - From Fire, Gold**

A ranked voting application for the Campaign Playbook with configurable assessment criteria.

![State of Cibola](https://img.shields.io/badge/State-Cibola-FFD700?style=for-the-badge)
![Founded](https://img.shields.io/badge/Founded-2026-3E2723?style=for-the-badge)

## Overview

The State of Cibola Election Portal is an official government-style voting application designed for campaign team assessments. It features:

- 🗳️ **Ranked-Choice Voting**: Drag-and-drop interface for team rankings
- ⚙️ **Configurable Criteria**: Admin-managed assessment criteria per round
- 📊 **Real-Time Monitoring**: Live voting progress and activity feeds
- 📈 **Advanced Results**: Multiple views with CSV/PDF export
- 🔐 **Secure Authentication**: Team-based voter access
- 🎯 **Round Management**: Lock/unlock voting rounds dynamically

## Features

### For Voters
- Team code authentication with session persistence
- Intuitive drag-and-drop ranking interface
- Vote confirmation with official ballot numbers
- Vote history tracking
- Mobile-responsive design

### For Administrators
- **Setup Tab**:
  - Team name and code configuration
  - **Criteria configuration** (add, edit, activate/deactivate, assign to rounds)
  - Voter management (add, remove, reassign)
  - Round lock controls

- **Live Monitoring Tab**:
  - Real-time voting progress by team
  - Recent activity feed
  - Participation statistics
  - Auto-updating with Supabase realtime

- **Results Tab**:
  - View by all rounds, specific round, or criterion
  - Medal rankings (🥇🥈🥉)
  - Point breakdowns
  - Export to CSV and PDF

- **Voter Registry Tab**:
  - Complete voter list with voting status matrix
  - Filter by team
  - Visual indicators for completed votes

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Lucide React icons
- **Drag & Drop**: react-beautiful-dnd
- **PDF Export**: jsPDF

## Database Schema

The application uses 6 Supabase tables:

1. **teams** - Campaign teams (Vega, Spence, Sterling, Strongbow, Thorne)
2. **voters** - Registered voters with team assignments
3. **votes** - Individual ballot submissions with rankings
4. **round_locks** - Round open/closed status
5. **app_settings** - Application configuration
6. **criteria** - Configurable assessment criteria (KEY FEATURE)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd playbook_voting
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema in the Supabase SQL Editor:
   - Open `supabase-schema.sql`
   - Copy and execute the entire schema in your Supabase project

3. The schema will create:
   - All required tables with proper constraints
   - Row Level Security policies
   - Initial data (5 teams, 4 round locks, 3 default criteria)

### 4. Configure Environment

The Supabase credentials are already configured in `src/lib/supabase.js`:
- URL: `https://wbptrluqjmunknpdqsow.supabase.co`
- Anon Key: Already included

If you need to use a different Supabase project, update these values in `src/lib/supabase.js`.

### 5. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:3000`

## Usage

### Voter Access

1. Click "Voter Portal" from the home page
2. Enter your team code (e.g., NOVA47, ORBIT92, COSMO38, LUNAR65, ASTRO21)
3. Enter your first name
4. Select a round and criterion to vote
5. Drag teams to rank them (your own team is excluded)
6. Submit your official ballot

**Team Codes:**
- Vega: `NOVA47`
- Spence: `ORBIT92`
- Sterling: `COSMO38`
- Strongbow: `LUNAR65`
- Thorne: `ASTRO21`

### Admin Access

1. Click "Administrator Portal" from the home page
2. Enter admin password: `HGI2028`
3. Access four main tabs:

#### Setup Tab
- **Team Configuration**: Edit team names and codes
- **Criteria Configuration**:
  - Add new criteria (e.g., "Innovation", "Teamwork")
  - Edit names, icons, descriptions
  - Assign criteria to specific rounds (checkboxes)
  - Activate/deactivate criteria
  - Changes apply to future rounds, preserving historical data
- **Voter Management**: Add voters, track participation
- **Round Locks**: Lock/unlock voting rounds

#### Monitoring Tab
- View real-time voting progress
- See recent ballot submissions
- Track participation by team
- Filter by round

#### Results Tab
- View aggregate or filtered results
- Export to CSV or PDF
- Medal rankings with point breakdowns

#### Voter Registry Tab
- Complete voter list with status matrix
- Visual indicators for completed votes
- Filter by team

## Configurable Criteria System

### Key Feature: Dynamic Criteria Configuration

The **Criteria Configuration** system allows administrators to fully customize assessment criteria:

1. **Add New Criteria**:
   - Unique ID (e.g., "innovation")
   - Display name (e.g., "Innovation")
   - Emoji icon (e.g., "💡")
   - Description
   - Active rounds (checkboxes for R1-R4)

2. **Edit Existing Criteria**:
   - Toggle rounds on/off
   - Activate/deactivate
   - Delete if no longer needed

3. **Historical Preservation**:
   - Changes only affect future votes
   - Past votes retain original criterion data
   - Results show historical criterion names if changed

### Default Criteria

- **Creativity** 🎨 (Rounds 1-4): Originality and innovative thinking
- **Effectiveness** ⚡ (Rounds 1-4): Impact and measurable results
- **Adaptation** 🔄 (Round 4): Ability to adjust based on feedback

## Voting System

### Scoring
- 1st place: 5 points
- 2nd place: 4 points
- 3rd place: 3 points
- 4th place: 2 points

### Rounds
- 4 total assessment rounds
- Each round can have different active criteria
- Admins control when rounds are open/locked

### Confirmation Numbers
Format: `CPB-R#C-TEAM-####`
- Example: `CPB-R1C-NOVA-4857`

## Design System

### Colors
- **Ironwood** (#3e2723): Primary dark brown
- **Sulphur** (#ffd700): Accent gold
- **Federal Blue** (#1e3a8a): Buttons and highlights
- **Cream** (#fef3c7): Light backgrounds

### Typography
- Headers: Georgia serif
- Body: Inter sans-serif

### Icons
- 🇺🇸 US Flag
- ⭐ State seal star
- 🗳️ Voting
- 🔐 Admin access

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Environment Variables

No `.env` file is required. Supabase credentials are configured directly in `src/lib/supabase.js`.

For production deployment, consider:
- Moving credentials to environment variables
- Enabling Supabase RLS with proper authentication
- Using Supabase Auth for admin login

## Contact

**State of Cibola Election Commission**
Email: cibola2028@cooperativeimpactlab.org
Founded: 2026

---

*Ex Igne, Aurum • State of Cibola • Founded 2026*
