# StatusNugget

A modern, full-stack status page and uptime monitoring application. Monitor your services, track uptime, and keep your users informed with a beautiful public status page.

## Features

- 🚀 **Real-time Monitoring**: Automatically checks service uptime at configurable intervals
- 📊 **Uptime Tracking**: 90-day uptime percentage calculation with visual bars
- 📈 **Performance Metrics**: Response time tracking with charts (7d, 30d, 90d)
- 📱 **Public Status Page**: Beautiful, responsive status page for your users
- 🎛️ **Admin Dashboard**: Manage services and incidents from an intuitive dashboard
- 🔔 **Incident Management**: Create and manage service incidents with status updates
- 📅 **Incident History**: View incidents grouped by date with full timeline
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📡 **RSS Feed**: Downloadable RSS feed for status updates
- 📲 **SMS Notifications**: Twilio and ClickSend integrations for uptime alerts
- 🎨 **Modern UI**: Clean, responsive design that works on all devices

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Frontend**: React.js
- **Charts**: Recharts
- **Monitoring**: Automated HTTP checks with configurable intervals
- **Notifications**: Twilio, ClickSend

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables (create a `.env` file):
   ```env
   PORT=3001
   CHECK_INTERVAL=60000
   
   # Optional: Twilio Configuration
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone
   NOTIFICATION_PHONE_TWILIO=+1234567890
   
   # Optional: ClickSend Configuration
   CLICKSEND_USERNAME=your_username
   CLICKSEND_API_KEY=your_api_key
   NOTIFICATION_PHONE_CLICKSEND=+1234567890
   ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

   Or start them separately:
   - Backend: `npm start` (runs on port 3001)
   - Frontend: `cd client && npm start` (runs on port 3000)

## Usage

1. **Add Services**: Go to the Dashboard and add services to monitor
2. **View Status**: Check the public status page for real-time service status
3. **Monitor Performance**: Switch to the Performance tab to view response time metrics
4. **Manage Incidents**: Create and update incidents from the Dashboard
5. **Download RSS Feed**: Click the RSS feed button to download status updates

## SMS Notifications

StatusNugget supports SMS notifications via Twilio and ClickSend:

- **Down Alerts**: Receive SMS when a service goes down
- **Recovery Alerts**: Receive SMS when a service comes back up

Configure your phone numbers in the `.env` file using:
- `NOTIFICATION_PHONE_TWILIO` for Twilio
- `NOTIFICATION_PHONE_CLICKSEND` for ClickSend

## API Endpoints

- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get a specific service
- `GET /api/services/:id/uptime?days=90` - Get uptime data
- `GET /api/services/:id/performance?days=90` - Get performance data
- `GET /api/public/status?days=90` - Get public status
- `GET /api/rss` - RSS feed
- `GET /api/incidents` - Get all incidents

## License

MIT
