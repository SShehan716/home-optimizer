# Home Optimizer - AI Interior Design App

An intelligent, mobile-responsive web application that uses AI to transform your room photos into beautifully arranged spaces and provides personalized design advice.

## Features

- **AI Room Analysis**: Leverages Google Gemini to analyze uploaded photos of your room.
- **Smart Recommendations**: Get tailored suggestions for furniture placement, color palettes, and decor.
- **Modern UI**: Clean, responsive design built with React and Vite.
- **Iconography**: Beautiful icons provided by Lucide React.

## Technologies Used

- **Frontend**: React 19, Vite
- **AI Integration**: Google Generative AI SDK (`@google/generative-ai`)
- **Styling**: Vanilla CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A Google Gemini API Key
- An OpenRouter API Key (for the Chat Assistant)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy the `.env.example` file to create a new `.env` file:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and replace the placeholders with your actual API keys.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Bundles the app for production.
- `npm run lint`: Runs ESLint to catch code issues.
- `npm run preview`: Previews the production build locally.
