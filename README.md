# Asset Admin Panel

A production-ready admin panel starter for asset management using React, TypeScript, Firebase, Tailwind CSS, React Router, and React Query.

## Features

- Admin email/password authentication via Firebase
- Secure protected admin routes
- Dashboard analytics and charts
- Wallet management and transaction history
- User management with search and filters
- Transaction reports for revenue, withdraw, recharge, bonus
- Responsive design and modern UI components
- Reusable components and scalable folder structure

## Project Structure

- `src/components` - reusable UI components
- `src/pages` - application pages
- `src/layouts` - page layouts and navigation structure
- `src/firebase` - Firebase initialization and helpers
- `src/context` - global auth state
- `src/services` - API interaction and Firestore helpers
- `src/hooks` - custom hooks
- `src/types` - shared TypeScript definitions
- `src/utils` - utility and formatting helpers

## Setup

1. Copy `.env.example` to `.env`
2. Fill Firebase configuration values
3. Install dependencies:

```bash
npm install
```

4. Run locally:

```bash
npm run dev
```

## Deployment

Target a Next.js deployment platform like Vercel.

1. Run the standard Next.js build
2. Configure environment variables in Vercel using `NEXT_PUBLIC_FIREBASE_...` keys
3. Deploy the app and verify Firebase config

## Firebase Collections

- `users`
- `wallets`
- `transactions`
- `reports`

## Firebase Security Rules

Use the `firebase.rules` file as a starting point.

## Notes

- Admin role gating uses Firestore `users/{uid}.role`
- Replace placeholder default admin objects with your own data structure
