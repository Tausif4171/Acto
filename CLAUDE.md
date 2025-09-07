# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (Next.js)
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Backend (Go/Gin server)
```bash
# Navigate to server directory
cd server

# Run the Go server (requires .env file with API keys)
go run main.go

# Install dependencies
go mod download
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.3 with React 19, TypeScript, Tailwind CSS v4
- **Backend**: Go with Gin framework for REST API
- **AI Integration**: OpenAI GPT-4o-mini for transcript summarization

### Project Structure
- `/app` - Next.js app directory with components and pages
  - `page.tsx` - Landing page with upload interface
  - `components/UploadTranscript.tsx` - Main transcript upload and processing component
- `/server` - Go backend server
  - `main.go` - API endpoints for transcript processing and email sending
  - Uses environment variables from `.env` for OpenAI API key and Gmail credentials

### Key Functionality
1. **Transcript Processing**: Frontend accepts .txt file uploads, sends to backend API at `localhost:8080/api/parse-transcript`
2. **AI Summarization**: Backend calls OpenAI API to generate meeting summaries with action items and decisions
3. **PDF Export**: Client-side PDF generation using html2pdf.js with custom styling
4. **Email Delivery**: Backend sends summaries via Gmail SMTP (requires app password)

### API Endpoints
- `POST /api/parse-transcript` - Processes transcript with OpenAI
- `POST /api/send-email` - Sends summary via email

### Environment Variables (server/.env)
Required for backend operation:
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o-mini
- `GMAIL_EMAIL` - Gmail address for sending emails
- `GMAIL_PASS` - Gmail app password (not regular password)
- `PORT` - Server port (defaults to 8080)