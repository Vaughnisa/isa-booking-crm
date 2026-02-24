# ISA Booking CRM

A Stripe-based booking and client management system for International Sailing Academy.

## Features

- **Admin Dashboard**: Overview stats, upcoming clinics, recent bookings
- **Clinic Management**: Manage clinic schedules, capacity, and status
- **Booking Flow**: Multi-step booking with Stripe payment integration
- **Client Database**: Searchable client profiles with booking history
- **Waiting List**: Manage waitlist and promote when spots open

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Stripe (Test Mode)
- Supabase
- shadcn/ui

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repo-url>
cd isa-crm/my-app
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Database Setup

Run the SQL migrations in `supabase/migrations/` to create tables:
- clinics
- bookings
- clients
- waiting_list

### 4. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Switch to Test Mode
3. Get your API keys from Developers → API keys
4. Create a webhook endpoint pointing to `/api/webhooks/stripe`
5. Add the webhook signing secret to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database Schema

### clinics
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Clinic name |
| date | date | Clinic date |
| coach | text | Assigned coach |
| capacity | int | Max participants |
| price | int | Price in cents |
| status | enum | open, closed, cancelled |

### bookings
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| client_id | uuid | FK to clients |
| payment_status | enum | pending, paid, refunded |
| deposit_amount | int | Amount paid in cents |
| balance_due | int | Remaining balance |
| stripe_session_id | text | Stripe checkout session |

### clients
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Full name |
| email | text | Email address |
| phone | text | Phone number |
| experience_level | enum | beginner, intermediate, advanced |
| weight | int | Weight in lbs |
| sail_size | text | Preferred sail size |
| notes | text | Internal notes |

### waiting_list
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| name | text | Full name |
| email | text | Email address |
| phone | text | Phone number |
| requested_at | timestamp | When added |

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Demo

This is a prototype/template for review. All Stripe transactions are in test mode.

Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any ZIP
