# Davis Dashboard

A modern dashboard application built with Next.js that integrates with Google Calendar and Perplexity AI.

## Features

- **Google Calendar Integration**: Full calendar functionality with embedded Google Calendar view
- **AI Assistant**: Powered by Perplexity AI for intelligent responses
- **Modern UI**: Clean, responsive design with dark theme
- **Authentication**: Secure Google OAuth integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- Google Cloud Platform account
- Perplexity AI API key

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Perplexity AI
PERPLEXITY_API_KEY=your_perplexity_api_key
```

### Google Calendar Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins and redirect URIs
6. Copy the Client ID and Client Secret to your `.env.local` file

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Calendar Features

The calendar page provides:

- **Embedded Google Calendar**: Full calendar functionality directly from Google
- **Multiple Views**: Day, Week, Month, and Year views
- **CRUD Operations**: Create, edit, and delete events directly in the calendar
- **Navigation**: Easy navigation between different time periods
- **Authentication**: Secure Google OAuth integration

### Using the Calendar

1. Click "Connect Google Calendar" to authenticate
2. Use the view buttons to switch between Day, Week, Month, and Year views
3. Navigate using the arrow buttons or click "Today" to return to current date
4. Click "Create Event" to open Google Calendar's event creation page
5. All event management is handled directly in the embedded calendar interface

## AI Assistant

The AI assistant uses Perplexity AI to provide intelligent responses to your questions. Simply type your question and get instant answers.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
