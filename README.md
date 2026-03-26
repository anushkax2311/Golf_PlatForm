# ⛳ GolfGives — Golf Charity Subscription Platform

A full-stack MERN application combining golf performance tracking, monthly prize draws, and charitable giving.

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Payments | Stripe (Subscriptions + Webhooks) |
| Email | Nodemailer |
| Scheduling | node-cron |
| Deployment | Vercel (frontend) + Render/Railway (backend) + MongoDB Atlas |

---

## 📁 Project Structure

```
golf-platform/
├── server/                     # Express API
│   ├── controllers/            # Route logic
│   │   ├── authController.js
│   │   ├── scoreController.js
│   │   ├── drawController.js
│   │   ├── charityController.js
│   │   ├── paymentController.js
│   │   ├── adminController.js
│   │   └── winnerController.js
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Score.js
│   │   ├── Charity.js
│   │   └── Draw.js
│   ├── routes/                 # Express routers
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── scores.js
│   │   ├── draws.js
│   │   ├── charities.js
│   │   ├── payments.js
│   │   ├── admin.js
│   │   └── winners.js
│   ├── middleware/
│   │   └── auth.js             # JWT + role guards
│   ├── utils/
│   │   └── email.js            # Nodemailer wrapper
│   ├── index.js                # Entry point + cron
│   ├── seed.js                 # Database seeder
│   └── .env.example
│
└── client/                     # React SPA
    └── src/
        ├── context/
        │   └── AuthContext.jsx # Global auth state
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── PricingPage.jsx
        │   ├── CharitiesPage.jsx
        │   ├── CharityDetailPage.jsx
        │   ├── DrawsPage.jsx
        │   ├── DashboardPage.jsx
        │   └── AdminPage.jsx
        ├── components/
        │   └── layout/
        │       ├── Navbar.jsx
        │       └── Footer.jsx
        ├── utils/
        │   └── api.js          # Axios instance
        └── styles/
            └── globals.css     # Design system
```

---

## 🚀 Quick Start

### 1. Clone & install dependencies

```bash
git clone <your-repo-url>
cd golf-platform
npm run install-all
```

### 2. Configure environment variables

**Server:**
```bash
cd server
cp .env.example .env
# Fill in: MONGODB_URI, JWT_SECRET, STRIPE keys, EMAIL credentials
```

**Client:**
```bash
cd client
cp .env.example .env
# Fill in: VITE_STRIPE_PUBLISHABLE_KEY
```

### 3. Seed the database

```bash
cd server
node seed.js
```

This creates:
- Admin: `admin@golf.com` / `password123`
- Subscriber: `john@golf.com` / `password123`
- 8 sample charities
- 1 sample published draw

### 4. Start development servers

```bash
# From root — runs both server and client
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## 🔑 Environment Variables

### Server (`server/.env`)

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/golf_platform

# JWT
JWT_SECRET=your_very_long_random_secret_key
JWT_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

# Client (for CORS)
CLIENT_URL=http://localhost:5173

# Email (optional — falls back to console.log)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=GolfGives <noreply@golfgives.com>
```

### Client (`client/.env`)

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 💳 Stripe Setup

1. Create a Stripe account at stripe.com
2. Create two Products with recurring prices:
   - **Monthly**: £9.99/month → copy `price_id` to `STRIPE_MONTHLY_PRICE_ID`
   - **Yearly**: £89.99/year → copy `price_id` to `STRIPE_YEARLY_PRICE_ID`
3. Set up webhook: `https://your-api-url.com/api/payments/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

---

## 🗄 Data Models

### User
- Profile fields (name, email, password, avatar)
- Subscription (status, plan, Stripe IDs, period dates)
- Charity selection + contribution %
- Role: `subscriber` | `admin`

### Score
- Linked to user (one-to-one)
- Rolling array of up to 5 scores
- Each score: value (1–45) + date played

### Draw
- Month + Year (unique per month)
- 5 winning numbers (1–45)
- Prize pool breakdown (40/35/25%)
- Jackpot rollover tracking
- Winners array with verification + payment state

### Charity
- Full profile: name, description, category, events
- Stats: subscriber count, total received
- Featured flag

---

## 🛣 API Reference

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Protected |
| PUT | `/api/auth/password` | Protected |

### Scores
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/scores` | Subscriber |
| POST | `/api/scores` | Subscriber |
| PUT | `/api/scores/:id` | Subscriber |
| DELETE | `/api/scores/:id` | Subscriber |

### Draws
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/draws` | Protected |
| GET | `/api/draws/current` | Protected |
| POST | `/api/draws/simulate` | Admin |
| POST | `/api/draws/:id/publish` | Admin |

### Charities
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/charities` | Public |
| GET | `/api/charities/:slug` | Public |
| POST | `/api/charities` | Admin |
| PUT | `/api/charities/:id` | Admin |
| DELETE | `/api/charities/:id` | Admin |
| PUT | `/api/charities/select/:id` | Protected |

### Payments
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/payments/create-checkout` | Protected |
| POST | `/api/payments/portal` | Protected |
| POST | `/api/payments/webhook` | Stripe |
| GET | `/api/payments/status` | Protected |

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/analytics` | Admin |
| GET | `/api/admin/users` | Admin |
| PUT | `/api/admin/users/:id` | Admin |
| GET | `/api/admin/winners` | Admin |
| PUT | `/api/admin/winners/:drawId/:winnerId` | Admin |
| PUT | `/api/admin/winners/:drawId/:winnerId/pay` | Admin |

---

## 🎲 Draw Logic

### Score-to-Draw Mapping
Each subscriber's 5 most recent Stableford scores (range 1–45) become their 5 draw entries.

### Random Draw
Uses `Math.random()` to select 5 unique numbers from 1–45.

### Algorithmic Draw
Analyses the frequency of all user scores across the platform. More frequently scored values have a higher probability of being drawn (weighted random selection).

### Prize Distribution
| Match | Pool Share | Rollover |
|-------|-----------|----------|
| 5 numbers | 40% | ✅ Yes (jackpot) |
| 4 numbers | 35% | ❌ No |
| 3 numbers | 25% | ❌ No |

Prizes are split equally among multiple winners in the same tier.

### Monthly Cron
Runs on the 1st of every month at midnight. Auto-simulates a random draw if none exists for that month. Admin must manually publish to notify winners.

---

## 🏆 Winner Flow

1. Draw is simulated by admin → winners identified
2. Admin publishes draw → winners notified by email
3. Winner logs into dashboard → submits screenshot proof
4. Admin reviews proof → approves or rejects
5. Admin marks payment as completed → winner sees ✅ Paid

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd client
npm run build
# Deploy /dist to Vercel
# Set VITE_STRIPE_PUBLISHABLE_KEY in Vercel env vars
```

### Backend → Render / Railway
```bash
# Set all .env variables in your hosting platform
# Start command: node index.js
# Make sure MONGODB_URI points to Atlas
```

### Database → MongoDB Atlas
1. Create new cluster at cloud.mongodb.com
2. Create database user
3. Whitelist IP (or use 0.0.0.0/0 for all)
4. Copy connection string to `MONGODB_URI`

---

## ✅ Testing Checklist

- [ ] User signup & login
- [ ] Subscription flow (monthly and yearly via Stripe)
- [ ] Score entry — 5-score rolling logic
- [ ] Score edit and delete
- [ ] Draw simulation (random + algorithmic)
- [ ] Draw publish + winner notification
- [ ] Charity selection and contribution slider
- [ ] Winner proof upload
- [ ] Admin: verify/reject winner, mark paid
- [ ] User Dashboard — all 4 tabs functional
- [ ] Admin Panel — all 5 sections functional
- [ ] Data accuracy across modules
- [ ] Responsive design (mobile + desktop)
- [ ] Error handling on all forms

---

## 🎨 Design System

Dark, modern aesthetic with:
- **Primary font**: Syne (headings) + DM Sans (body)
- **Accent**: `#b8f442` (lime green) — CTAs, active states
- **Gold**: `#f5c842` — prizes, winnings
- **Charity blue**: `#42c5f5` — charity features
- Motion-enhanced with CSS transitions and micro-interactions
- Fully responsive (mobile-first)

---

*Built as a full-stack MERN assignment for Digital Heroes — digitalheroes.co.in*
