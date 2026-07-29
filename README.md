# ReadyPips - AI-Powered Trading Signals Platform

A comprehensive trading signals platform with AI-powered analysis, M-Pesa payments, funded trading challenges, and an admin dashboard.

## Features

### Trading Signals
- AI-powered trading signals with up to 93% accuracy
- Real-time forex, crypto, and stock market analysis
- Harmonic pattern analysis
- TradingView chart integration
- Market news and calendar

### Subscription Plans
- **Weekly** - $27.99 USD / KES 3,640
- **Monthly** - $57.99 USD / KES 7,540 (Most Popular)
- **Quarterly** - $147.99 USD / KES 19,240

### Payment Methods
- **M-Pesa** (Safaricom STK Push) - Primary payment method for Kenyan users
- **Binance** (USDT manual submission)
- **Paystack** (Card payments)
- **Whop** (International checkout)

### Funded Trading Challenge
- **Entry Fee**: $42.99 USD (charged via M-Pesa at KES equivalent)
- **Prize Pool**: $5,000 USD shared among top 10 traders
- **Duration**: 30 days
- **Rules**: 10% profit target, 5% max drawdown
- **MT5 Credentials**: Participants submit MT5 login, password, server, group, balance, leverage
- **Leaderboard**: Real-time ranking based on profit performance
- **Admin Management**: Full CRUD for participants, leaderboard stats, and status

### Admin Dashboard
- User management
- Subscription management (filter by payment provider)
- Challenge participants and leaderboard management
- Transaction tracking
- Partner/affiliate management
- Support ticket management
- Email campaigns
- Revenue analytics

## Tech Stack

- **Framework**: Next.js 16.2.12 (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: MongoDB Atlas (database: READYPIPS)
- **Authentication**: JWT + NextAuth.js
- **Payments**: M-Pesa STK Push (Safaricom Daraja API), Binance, Paystack, Whop
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: TradingView widgets
- **SMS**: TextSMS API (Kenya)
- **Email**: SMTP2GO
- **Deployment**: Vercel

## Database Collections

| Collection | Purpose |
|------------|---------|
| users | User accounts and profiles |
| payment_intents | Payment records (M-Pesa, Binance, etc.) |
| challenge_participants | MT5 credentials and leaderboard data |
| subscriptions | Active subscriptions |
| fx_rates | Currency exchange rates (KES/USD) |
| signals | Trading signals |
| support_tickets | Support requests |
| partners | Partner/affiliate accounts |

## API Routes

### M-Pesa Payment Flow
- POST /api/mpesa/stkpush - Initiate STK push payment
- POST /api/mpesa/callback - Safaricom callback handler
- POST /api/mpesa/query - Query STK push status
- POST /api/mpesa/status - Check payment status
- POST /api/payments/mpesa/status - Payment status for polling

### Challenge Flow
- POST /api/challenge/mt5-credentials - Save MT5 credentials after payment
- GET /api/challenge/mt5-credentials - Fetch user challenge status
- GET /api/challenge/leaderboard - Public leaderboard (top 10)

### Admin
- GET/PUT/DELETE /api/admin/funding/challenge-participants - Manage challenge participants
- GET /api/admin/funding/participants - Legacy funding participants
- GET/POST/PUT/DELETE /api/admin/users - User management
- GET/POST /api/admin/subscriptions - Subscription management
- GET /api/admin/dashboard/stats - Dashboard statistics

## Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=READYPIPS

# Authentication
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://readypips-fix.vercel.app
JWT_SECRET=...

# M-Pesa (Safaricom Daraja API)
MPESA_ENV=production
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_PASSKEY=...
MPESA_SHORTCODE=...
MPESA_CALLBACK_URL=https://readypips.com/api/mpesa/callback

# SMS (TextSMS)
SMS_API_KEY=...
SMS_BASE_URL=https://sms.textsms.co.ke/api/services
SMS_PARTNER_ID=...
SMS_SENDER_ID=TextSMS

# Email (SMTP2GO)
SMTP_HOST=mail.smtp2go.com
SMTP_PORT=2525
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM_NAME=...
SMTP_FROM_EMAIL=...

# App URL
NEXT_PUBLIC_APP_URL=https://readypips-fix.vercel.app
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Safaricom Daraja API credentials (for M-Pesa)

### Installation

```bash
# Clone the repository
git clone https://github.com/maxson-group/readypips.git
cd readypips

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev

# Build for production
npm run build
```

### Deployment

The project is deployed on Vercel:
- Production URL: https://readypips-fix.vercel.app
- Project: mikomike200-2201s-projects/readypips-fix

```bash
# Deploy via Vercel CLI
vercel --prod --yes --token YOUR_VERCEL_TOKEN
```

## Challenge Flow (Complete)

1. User visits /funding and clicks "Pay $42.99 via M-Pesa"
2. User enters M-Pesa phone number and accepts Terms and Conditions
3. STK push is sent to Safaricom (/api/mpesa/stkpush)
4. "Waiting for Payment" modal appears with polling
5. User enters M-Pesa PIN on phone
6. Safaricom sends callback to /api/mpesa/callback then payment marked as paid
7. Polling detects payment confirmed then "Payment Confirmed!" modal
8. MT5 credentials form opens automatically
9. User enters MT5 login, password, server, etc. then saved to challenge_participants
10. User appears on the public leaderboard
11. Admin manages participants from admin dashboard Funding section

## Repositories

- Main: https://github.com/maxson-group/readypips
- Fix Branch: https://github.com/maxson-group/readypips/tree/test/mpesa-stk-push-payment
- Vercel: https://github.com/webmike254/radypips-fix

## License

Proprietary - ReadyPips Team