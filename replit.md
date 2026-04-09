# NagarSetu — Municipal Civic Issue Reporting Portal

## Overview
NagarSetu is a full-stack civic issue reporting portal for Indian citizens. Citizens report municipal issues (roads, water, sanitation, etc.), upvote them, and track resolution. Built for three types of users: Citizens, District Magistrate (Admin), and Municipal Corporations.

## Architecture

### Stack
- **Frontend**: React + Vite + TailwindCSS + Shadcn UI + Wouter routing + TanStack Query
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Replit Auth (OIDC) for citizens; bcryptjs session-based auth for admin/municipal
- **Fonts**: DM Sans (body), Outfit (display/headings)
- **Color Theme**: #EEFABD bg, #A0D585 secondary, #6984A9 accent, #263B6A dark, #344E41 titles

### Key Directories
```
client/src/
  pages/
    admin/      - AdminLogin, AdminDashboard, AdminMunicipalDetail
    municipal/  - MunicipalLogin, MunicipalDashboard
    Leaderboard.tsx, Dashboard.tsx, IssueDetail.tsx, Profile.tsx, CreateIssue.tsx, Landing.tsx
  components/
    Navbar.tsx, Footer.tsx, IssueCard.tsx, AadhaarPrompt.tsx
  hooks/
    use-auth.ts, use-admin-auth.ts, use-municipal-auth.ts, use-issues.ts, use-profile.ts

server/
  routes.ts   - All API endpoints
  storage.ts  - DatabaseStorage class (repository pattern)
  adminAuth.ts - Admin + Municipal bcrypt auth + seeding

shared/
  schema.ts   - All Drizzle table definitions + Zod schemas
  routes.ts   - API route definitions + shared types
```

## Database Tables
- `users` — Replit Auth users (mandatory, do not modify)
- `sessions` — Replit Auth sessions (mandatory, do not modify)
- `profiles` — Citizen profiles: aadhaarNumber, points, badge
- `issues` — Civic issues with status, wardArea, assignedMunicipalId, etc.
- `upvotes` — Many-to-many users ↔ issues
- `issue_logs` — Full status change timeline per issue
- `municipal_corps` — Municipal corporation accounts (username/password)
- `admins` — DM admin accounts (username/password)
- `point_logs` — Points activity log per citizen

## Routes
### Citizen (Replit Auth)
- `/` — Home (Dashboard if logged in, Landing if not)
- `/issues/new` — Create issue (protected)
- `/issues/detail?id=X` — Issue detail with progress roadmap
- `/profile` — Profile with points, badge, aadhaar
- `/leaderboard` — Public leaderboard (top 50 citizens)

### Admin Portal (DM)
- `/admin/login` — DM login (dm_admin / admin123)
- `/admin/dashboard` — Issue overview table with filters, stats, CSV export
- `/admin/municipal/:id` — Per-municipal corporation breakdown

### Municipal Portal
- `/municipal/login` — Municipal corp login (ward1_muni / muni123)
- `/municipal/dashboard` — Claim issues, update status, history

## Points System
- Report new issue: +10 pts
- Issue claimed: +5 pts (reporter)
- Issue resolved: +20 pts (reporter)
- Resolved within 3 days: +10 bonus pts

## Badge Tiers
- 0–49: Citizen (gray)
- 50–149: Active Member (amber)
- 150–499: Community Hero (silver)
- 500–999: Ward Champion (gold)
- 1000+: City Legend (purple)

## Important Notes
- NEVER modify `shared/models/auth.ts` — Replit Auth depends on it
- NEVER modify `vite.config.ts` or `server/vite.ts`
- Run `npm run db:push` after schema changes
- Logo: `@assets/image_1773048982249.png` (orange bridge with people)
- Admin/Municipal portals have standalone layouts (no citizen Navbar/Footer)
