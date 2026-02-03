# HealthSnap Setup Guide

## Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn
- API Keys:
  - [Anthropic Claude API](https://console.anthropic.com/) - for AI analysis
  - [Deepgram API](https://console.deepgram.com/) - for speech-to-text

## Quick Start

### 1. Install Dependencies

```bash
cd healthsnap
npm install
```

### 2. Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local and add your API keys:
# - ANTHROPIC_API_KEY
# - DEEPGRAM_API_KEY
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates SQLite file)
npm run db:push

# Seed with demo data (doctors, time slots, demo patient)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
healthsnap/
├── app/
│   ├── (dashboard)/         # Dashboard routes (record, reports, doctors, etc.)
│   │   ├── record/          # Voice recording page
│   │   ├── reports/         # Reports listing and detail
│   │   ├── doctors/         # Doctor browsing
│   │   └── appointments/    # Appointment management
│   ├── api/                 # API routes
│   │   ├── voice-notes/     # Voice note upload & management
│   │   ├── analyze/         # AI analysis endpoint
│   │   ├── reports/         # Report generation & retrieval
│   │   ├── doctors/         # Doctor listing & search
│   │   └── appointments/    # Booking endpoints
│   ├── components/          # React components
│   │   ├── ui/              # Base UI components (shadcn/ui)
│   │   ├── voice/           # Voice recording components
│   │   ├── reports/         # Report display components
│   │   └── doctors/         # Doctor cards, search
│   ├── lib/                 # Utility functions
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data script
├── public/                  # Static assets
└── ...config files
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:reset` | Reset database and re-seed |

## Key Features Implementation

### Voice Recording
- Uses Browser MediaRecorder API
- Supports audio/webm format
- Located in `app/components/voice/VoiceRecorder.tsx`

### Speech-to-Text
- Deepgram API integration
- API route: `app/api/voice-notes/transcribe/route.ts`

### AI Analysis
- Claude API (Anthropic)
- Structured JSON output for risk assessment
- API route: `app/api/analyze/route.ts`

### Database Models
- **Patient**: User profiles
- **VoiceNote**: Recorded symptom descriptions
- **RiskAssessment**: AI-generated risk analysis
- **Report**: Generated health reports
- **Doctor**: Healthcare providers
- **TimeSlot**: Available appointment times
- **Appointment**: Booked appointments

## Demo Account

After seeding, use the demo patient account:
- **Email**: demo@healthsnap.test

## Troubleshooting

### Database Issues
```bash
# Reset everything and start fresh
rm prisma/dev.db
npm run db:push
npm run db:seed
```

### Prisma Client Issues
```bash
# Regenerate client
npm run db:generate
```

### Port Already in Use
```bash
# Use a different port
npm run dev -- -p 3001
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Consider switching to PostgreSQL:
   - Update `datasource` in `schema.prisma`
   - Update `DATABASE_URL` format
3. Set up proper authentication (NextAuth.js recommended)
4. Configure CORS and security headers
5. Set up proper file storage for audio files (S3, etc.)

## Tech Stack Summary

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite + Prisma ORM
- **AI**: Claude API (Anthropic)
- **Speech-to-Text**: Deepgram API
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand (optional)
- **Validation**: Zod
