# FastX P2P — Full Stack Web3 Application

A production-ready P2P crypto exchange platform built with Next.js 14, Privy, Thirdweb, and PostgreSQL.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database
- [Privy account](https://privy.io) → Get App ID & Secret
- [Thirdweb account](https://thirdweb.com) → Get Client ID

### 2. Configure Environment
Copy `.env.example` to `.env.local`, then add your credentials:
```env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
DATABASE_URL=postgresql://user:password@localhost:5432/p2p_exchange
THIRDWEB_SECRET_KEY=your-thirdweb-secret-key
BACKEND_WALLET_PRIVATE_KEY=your-platform-wallet-private-key
NEXT_PUBLIC_PLATFORM_HOT_WALLET=your-platform-wallet-address
BSCSCAN_API_KEY=your-bscscan-api-key
```

### 3. Setup Database
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected routes
│   │   ├── dashboard/        # Main dashboard
│   │   ├── wallet/           # Wallet management
│   │   ├── transactions/     # Transaction history
│   │   ├── referrals/        # Referral program
│   │   └── settings/         # Profile & UPI settings
│   ├── api/                  # Backend API routes
│   │   ├── users/me/         # User CRUD
│   │   ├── wallet/           # Portfolio data
│   │   ├── wallet/deposit/   # Deposit workflow
│   │   ├── wallet/withdraw/  # Withdrawal workflow
│   │   ├── transactions/     # Transaction history
│   │   ├── offers/           # P2P offers CRUD
│   │   └── referrals/        # Referral tracking
│   ├── login/                # Login page
│   └── page.tsx              # Landing page
├── components/
│   ├── ui/                   # Button, Card, Modal, Input, Badge
│   ├── landing/              # Navbar, Hero, Features, FAQ, Footer
│   └── dashboard/            # Sidebar, TopNav, ActionButtons, etc.
├── hooks/                    # useUser, useWallet, useTheme
├── lib/
│   ├── api/mockApi.ts        # 🔌 Swap-ready API layer
│   ├── db/prisma.ts          # Database client
│   ├── thirdweb/client.ts    # Thirdweb SDK
│   └── privy/config.ts       # Privy configuration
└── types/index.ts            # TypeScript types
```

---

## 🔌 Swapping Mock APIs with Real Endpoints

All external API calls are in `src/lib/api/mockApi.ts`. To use real APIs:

1. Update `MOCK_API_BASE_URL` in `.env.local`
2. In each function, comment out the mock return and uncomment the `apiClient` call
3. Adjust the response shape if needed

Example:
```typescript
export async function generateDepositAddress(request) {
  // Comment out mock:
  // await simulateDelay(800);
  // return { address: `0x...`, ... };
  
  // Uncomment real API:
  const { data } = await apiClient.post('/deposits/address', request);
  return data;
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS v4 |
| Auth | Privy (email/social + embedded wallets) |
| Blockchain | Thirdweb SDK |
| Database | PostgreSQL + Prisma ORM |
| State | React hooks (no Redux needed) |

---

## 🔐 Security Features

- **Server-side auth verification** via Privy token validation in middleware
- **Route protection** — unauthenticated users redirect to `/login`
- **Balance validation** before withdrawals
- **Non-custodial wallets** — users own their keys via Privy embedded wallets

---

## 📱 Mobile-Friendly

- Responsive layout with collapsible sidebar
- Mobile hamburger navigation
- Touch-optimized action buttons
- Bottom-aligned modals on mobile

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

Set every variable in `.env.example` in the Vercel dashboard. `PRIVY_APP_SECRET`, `THIRDWEB_SECRET_KEY`, `BACKEND_WALLET_PRIVATE_KEY`, and `ADMIN_API_KEY` must remain server-only: never prefix them with `NEXT_PUBLIC_`.

### Docker
```bash
docker build -t p2p-exchange .
docker run -p 3000:3000 p2p-exchange
```
