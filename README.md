# Business CRM - React + Vercel + Supabase

A modern Business CRM application built with React, deployed on Vercel, and using Supabase for the database. This is a complete rewrite of the original Streamlit application.

## Features

- **Bookings Management** - Schedule, view, and manage client bookings
- **Contacts Management** - Add, edit, and manage client contacts
- **Service Management** - Create hierarchical service categories and services
- **Communication** - Direct WhatsApp messaging and Jitsi Meet video calls
- **System Logs** - Track all application activity and errors

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Icons**: React Icons
- **Date Handling**: date-fns

## Project Structure

```
├── api/                          # Vercel serverless functions
│   ├── bookings.js              # Booking CRUD operations
│   ├── calls.js                 # Video call link sending
│   ├── categories.js            # Service categories CRUD
│   ├── contacts.js              # Contact management
│   ├── logs.js                  # System logging
│   ├── messages.js              # Message storage
│   ├── services.js              # Service CRUD
│   ├── whatsapp.js              # WhatsApp webhook
│   └── utils.js                 # Shared utilities
├── src/
│   ├── components/
│   │   ├── Bookings.jsx
│   │   ├── Communication.jsx
│   │   ├── Contacts.jsx
│   │   ├── Logs.jsx
│   │   ├── Services.jsx
│   │   └── dialogs/             # Modal components
│   │       ├── BookingDialog.jsx
│   │       ├── CategoryDialog.jsx
│   │       ├── ContactDialog.jsx
│   │       └── ServiceDialog.jsx
│   ├── lib/
│   │   ├── api.js               # API client
│   │   └── supabase.js          # Supabase client
│   ├── styles/
│   │   └── globals.css          # Global styles
│   ├── App.jsx                  # Main app component
│   └── main.jsx                 # React entry point
├── public/                       # Static assets
├── index.html                   # HTML entry point
├── package.json
├── vite.config.js
├── vercel.json                  # Vercel configuration
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- UltraMsg account (for WhatsApp integration - optional)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Fill in your Supabase credentials:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_ULTRAMSG_INSTANCE=your_instance_id
   VITE_ULTRAMSG_TOKEN=your_token
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## Deployment to Vercel

### Option 1: Using Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel project settings
5. Deploy

### Environment Variables on Vercel

Add these in your Vercel project settings (Settings → Environment Variables):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ULTRAMSG_INSTANCE`
- `VITE_ULTRAMSG_TOKEN`

## Database Schema

Your Supabase database should have the following tables:

- **contacts** - Client contact information
- **service_categories** - Service categories (main and sub)
- **services** - Service offerings with pricing
- **addons** - Optional add-ons for services (e.g., express booking, extra hours)
- **bookings** - Scheduled client bookings
- **messages** - WhatsApp message history
- **app_logs** - Application activity logs

## API Endpoints

All API endpoints are serverless functions in `/api`:

### Contacts
- `GET /api/contacts` - List all contacts
- `POST /api/contacts` - Create contact
- `PUT /api/contacts` - Update contact
- `DELETE /api/contacts?id=ID` - Delete contact

### Services
- `GET /api/services` - List all services
- `POST /api/services` - Create service
- `PUT /api/services` - Update service
- `DELETE /api/services?id=ID` - Delete service

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories` - Update category
- `DELETE /api/categories?id=ID` - Delete category

### Add-Ons
- `GET /api/addons?service_id=ID` - List add-ons for a service
- `POST /api/addons` - Create add-on
- `PUT /api/addons` - Update add-on
- `DELETE /api/addons?id=ID` - Delete add-on

### Bookings
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings` - Update booking
- `DELETE /api/bookings?id=ID` - Delete booking

### Messages
- `GET /api/messages` - List messages (with optional `contact_info` query)
- `POST /api/messages` - Create/save message

### Logs
- `GET /api/logs` - List system logs
- `DELETE /api/logs` - Clear all logs

### Communication
- `POST /api/whatsapp` - WhatsApp webhook handler
- `POST /api/calls` - Send video call link via WhatsApp

## WhatsApp Integration

To set up the WhatsApp webhook:

1. Configure your UltraMsg account
2. Set webhook URL to: `https://your-vercel-app.vercel.app/api/whatsapp`
3. Environment variables will be automatically loaded from Vercel

## Notes

- All dates are stored in ISO 8601 format in Supabase
- Phone numbers are automatically cleaned (digits only) before storage
- All API calls from the frontend go through CORS-enabled Vercel functions
- The app uses React hooks for state management
- Tailwind CSS for responsive, modern UI

## Troubleshooting

### "Missing Supabase credentials"
- Ensure `.env.local` file exists in the root directory
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly
- On Vercel, verify environment variables in project settings

### API calls failing
- Check that the API endpoint URL is correct
- Ensure CORS headers are being set (they are in `utils.js`)
- Verify Supabase connection and credentials

### WhatsApp messages not sending
- Confirm UltraMsg credentials are correct
- Check that the phone number is in international format
- Verify webhook URL is correctly configured in UltraMsg

## Migration from Streamlit

The original `escort-crm.py` and `webhook.py` have been converted to:

- `src/` - React frontend components
- `api/` - Serverless backend functions
- Database functionality remains the same (Supabase)

All features have been preserved and enhanced with a modern UI.

## License

MIT
