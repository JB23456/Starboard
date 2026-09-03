# Starboard

A questboard web app. Users sign up with a student number (one capital letter followed by 8 digits, e.g. `C24733535`) and a 6-digit PIN, complete quests (text or image submissions), earn stars, and climb a public leaderboard.

---

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Frontend (Pages)** | `src/app/` | Next.js App Router pages — landing/home, login, signup, dashboard, quests, leaderboard, admin panel |
| **Shared Components** | `src/components/` | Client components (e.g. `logout-button.tsx`) |
| **API Routes** | `src/app/api/` | Server-side route handlers for auth, CRUD on quests/submissions/users, and image serving |
| **Auth Library** | `src/lib/auth.ts` | Session management (create/destroy/validate), cookie handling, role-based access helpers |
| **Database Client** | `src/lib/db.ts` | Prisma client singleton (SQLite) |
| **Upload Library** | `src/lib/upload.ts` | File save/validate for image submissions (JPEG/PNG/WebP, 5 MB max) |
| **Prisma Schema** | `prisma/schema.prisma` | Data model: User, Quest, Submission, Session |
| **Static Config** | `next.config.ts` | Security headers (nosniff, frame options, referrer policy) |
| **Tailwind** | `tailwind.config.ts` | Styling with custom `star` color palette |

---

## Database Schema (SQLite)

```
User         — firstName, lastName, studentNumber (unique), pinHash, role, stars, active
Quest        — title, description, rewardStars, submissionType (text|image), active, removedAt
Submission   — questId, userId, textPayload, imagePath, status (pending|approved|rejected)
Session      — token (unique), userId, expiresAt
```

**One active submission per user per quest** is enforced at the application level (query before insert). Rejected submissions can be resubmitted.

---

## Getting Started

### Prerequisites

- Node.js 18+
- No external database needed (SQLite is used)

### Setup

```bash
npm install
npx prisma migrate dev    # creates the SQLite database
npm run dev               # starts on http://localhost:3000
```

### Production Build

```bash
npm run build             # runs prisma migrate deploy + next build
npm start                 # serves the production build
```

### First Run: Creating the Admin

There is no seeded admin account. **The first account to sign up is automatically assigned the `admin` role** (and is redirected to `/admin`). All subsequent signups get the regular `user` role.

To add or remove admin accounts afterwards, use **Set Role** in the admin panel (`/admin/users`).

> **Note:** On an existing database that was created before this change, the seeded admin from the old seed script may still exist. Demote it via `/admin/users` if you no longer need it.

---

## Configuration

### Environment Variables (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./dev.db` | Path to the SQLite database file. Change to `file:./production.db` in production. |

For production, create a `.env.production` file **on the deployment machine** (it is gitignored and not committed to the repository):

```
DATABASE_URL="file:./production.db"
```

### Frontend Configuration

All frontend styling is in `src/app/globals.css` and `tailwind.config.ts`. Key points:

- **Color scheme:** The `star` color palette (purple — `#A62899` / `#8C0378` / `#E8CDE4`) is defined in `tailwind.config.ts` under `theme.extend.colors.star`. Change `DEFAULT`, `dark`, and `light` values to rebrand. The page background is darkened via `src/app/globals.css`.
- **Layout:** The global header/nav/footer lives in `src/app/layout.tsx`. Modify links, branding, or add pages there. An **Admin** nav link is shown only to users with `role: "admin"`.
- **Home page:** `src/app/page.tsx` — a dual-mode page:
  - **Logged out:** marketing hero ("Earn stars, climb the board.") with Sign Up / Log In CTAs.
  - **Logged in:** "Welcome back" header with star count, pending-submission count, quests created in the last 2 days, and quick links to Dashboard / All Quests / Leaderboard, plus a Log Out button (`src/components/logout-button.tsx`).
- **Redirects after auth:** After login or signup, admins are sent to `/admin` and everyone else to `/` (the first account to sign up is an admin, so the very first signup lands on the admin panel).

### Backend / API Configuration

- **Auth:** `src/lib/auth.ts` — control session duration (`SESSION_DURATION_MS`), cookie flags (httpOnly, secure, sameSite).
- **Rate limiting:** `src/app/api/auth/login/route.ts` — the `loginAttempts` Map enforces 5 attempts per 15 minutes per student number. Adjust `MAX_ATTEMPTS` and `ATTEMPT_WINDOW_MS` to change. Note this is an **in-memory, per-process** limiter: it resets on restart and is not shared across multiple app instances.
- **Upload limits:** `src/lib/upload.ts` — `MAX_SIZE` (5 MB) and `ALLOWED_MIME` (jpeg/png/webp) control what's accepted.
- **Image storage:** Files are saved to `data/uploads/` relative to the project root. This directory should be persistent (back it up or use a volume in containerized deployments).

### Admin Access

Only users with `role: "admin"` can access `/admin/*` routes and admin API endpoints. The first account to sign up becomes the admin automatically. You can promote/demote users from the admin panel (`/admin/users`).

---

## Deployment (Single Machine)

The entire app runs as one Node.js process:

```bash
# On the target machine:
git clone <repo>
cd starboard
npm install
npm run build
npm start   # or use pm2/systemd to keep it running
```

### Using PM2 (recommended)

```bash
npm install -g pm2
pm2 start npm --name "starboard" -- start
pm2 save
pm2 startup   # follows instructions for auto-start on boot
```

### Using systemd

Create `/etc/systemd/system/starboard.service`:

```ini
[Unit]
Description=Starboard
After=network.target

[Service]
WorkingDirectory=/opt/starboard
ExecStart=/usr/bin/npm start
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

### Backups

```bash
# Backup database + uploads
tar -czf starboard-backup-$(date +%F).tar.gz prisma/dev.db data/uploads/
```

Restore:

```bash
tar -xzf starboard-backup-YYYY-MM-DD.tar.gz
# Restart the app
```

---

## Runbook

### Add a Quest
1. Log in as admin → navigate to `/admin/quests`
2. Click "+ New Quest"
3. Fill in title, description, reward stars, submission type
4. Click Create

### Review a Submission
1. Navigate to `/admin/submissions`
2. Click the "Pending" filter
3. Select a submission from the list
4. Read the submission, click **Approve** (awards stars) or **Reject** (requires a note)

### Reset a User's PIN
1. Navigate to `/admin/users`
2. Find the user, click "Reset PIN"
3. A new 6-digit PIN is generated and displayed — share it with the student

### Add a Quest Programmatically

```bash
curl -X POST http://localhost:3000/api/quests \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<token>" \
  -d '{"title":"Test Quest","description":"Do the thing","rewardStars":15,"submissionType":"text"}'
```

---

## Project Structure

```
starboard/
├── prisma/
│   ├── schema.prisma        # Data model
│   └── migrations/          # Auto-generated SQL migrations
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Global layout (header, footer)
│   │   ├── page.tsx         # Home (landing hero / logged-in home)
│   │   ├── login/           # Login page
│   │   ├── signup/          # Signup page
│   │   ├── dashboard/       # User dashboard (stars, submissions)
│   │   ├── quests/          # Public quest list + detail/submit
│   │   ├── leaderboard/     # Public leaderboard
│   │   ├── admin/           # Admin panel (role-gated)
│   │   │   ├── quests/      # CRUD quests
│   │   │   ├── submissions/ # Review queue + approve/reject
│   │   │   └── users/       # User management
│   │   └── api/
│   │       ├── auth/        # signup, login, logout
│   │       ├── quests/      # CRUD quests
│   │       ├── submissions/ # Create + review submissions
│   │       ├── users/       # Admin user management
│   │       └── images/      # Auth-gated image serving
│   ├── components/
│   │   └── logout-button.tsx # Client-side logout button
│   ├── lib/
│   │   ├── db.ts            # Prisma client
│   │   ├── auth.ts          # Session + cookie + role helpers
│   │   └── upload.ts        # File validation + storage
│   └── app/globals.css      # Tailwind base styles
├── data/uploads/            # Image storage (persistent)
├── .env                     # Dev env (gitignored)
├── .env.production          # Prod env (gitignored — created on the deployment machine)
├── next.config.ts           # Security headers
├── tailwind.config.ts       # Custom color palette
└── package.json
```

---

## Security Notes

- No hardcoded credentials: the first account to sign up becomes the admin; admin PIN resets use a cryptographically secure random number
- PINs are hashed with bcrypt (10 rounds); student number format (`A`–`Z` + 8 digits) is enforced server-side at signup
- Session cookies are HttpOnly, SameSite=Strict, Secure in production; 7-day expiry, purged on access when expired
- Login rate-limited: 5 attempts / 15 min per student number (in-memory, per-process — resets on restart)
- Image uploads validated server-side (MIME + size); files stored under random hex names
- Images served through auth-gated API route (not static); path traversal is blocked
- All API mutations check session + role; quest and submission detail endpoints are admin-only so submission content and student PII are never exposed publicly
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` headers set globally
- No Content-Security-Policy header is set — consider adding one if you embed third-party content
