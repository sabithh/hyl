# HYL Workspace Integration

This workspace contains 5 runnable projects:

- `backend/` - Node.js + Express API (port `5000`)
- `owner-web/` - Next.js owner dashboard (port `3000`)
- `mobile-app/` - Unified Flutter app with trainer/trainee role routing
- `trainer_app/` - Standalone installable Trainer Flutter app
- `trainee_app/` - Standalone installable Trainee Flutter app

## 1) Configure Supabase backend (required)

The backend database is Supabase PostgreSQL only.

1) Create a Supabase project and open Database connection settings.

2) Copy `backend/.env.supabase.example` to `backend/.env` and fill:

- `DATABASE_URL`: Supabase pooler URL (`6543`) for runtime traffic.
- `DIRECT_URL`: Supabase direct DB URL (`5432`) for Prisma schema changes.

3) Push Prisma schema to Supabase:

```powershell
Set-Location backend
npx prisma db push
npx prisma generate
```

## 2) Start optional shared services

Redis is optional for local development:

```powershell
docker compose up -d redis
```

## 3) Start backend API

```powershell
Set-Location backend
npm run dev
```

Backend health endpoint:

- `http://localhost:5000/api/health`

### Core onboarding flow (project objective)

Owner creates gym:

- `POST /api/auth/create-gym-owner`

Trainer or trainee joins an existing gym:

- `POST /api/auth/register`
- pass either `gymId` or `gymEmail`
- role must be `trainer` or `trainee`

Example payload for gym owner creation:

```json
{
	"gymName": "HYL Fitness",
	"gymEmail": "owner@hylfitness.com",
	"ownerName": "Gym Owner",
	"ownerEmail": "owner.user@hylfitness.com",
	"ownerPassword": "StrongPassword123"
}
```

Example payload for trainee join:

```json
{
	"gymEmail": "owner@hylfitness.com",
	"name": "New Trainee",
	"email": "trainee@hylfitness.com",
	"password": "StrongPassword123",
	"role": "trainee"
}
```

## 4) Start owner web

```powershell
Set-Location owner-web
# optional: copy .env.example to .env.local and customize
npm run dev
```

The dashboard connectivity widget on `/` reads `NEXT_PUBLIC_API_BASE_URL`.

## 5) Run Flutter apps against backend

For Android emulator use `10.0.2.2`:

```powershell
Set-Location mobile-app
flutter run --dart-define API_BASE_URL=http://10.0.2.2:5000
```

```powershell
Set-Location trainer_app
flutter run --dart-define API_BASE_URL=http://10.0.2.2:5000
```

```powershell
Set-Location trainee_app
flutter run --dart-define API_BASE_URL=http://10.0.2.2:5000
```

For physical devices, replace with your machine LAN IP, for example:

- `http://192.168.1.25:5000`

## 6) Build separate installable apps

```powershell
Set-Location trainer_app
flutter build apk --debug
```

```powershell
Set-Location trainee_app
flutter build apk --debug
```

APKs are generated at:

- `trainer_app/build/app/outputs/flutter-apk/app-debug.apk`
- `trainee_app/build/app/outputs/flutter-apk/app-debug.apk`

## Production notes

- Keep `JWT_SECRET` and `JWT_REFRESH_SECRET` set to long random values.
- Set `CORS_ORIGIN` to your frontend domain in production.
- You can keep local Docker Redis or migrate to a managed Redis provider.

## Free hosting quick start (Render)

This repository includes a Render blueprint at [render.yaml](render.yaml).

1) Push this repository to GitHub.
2) In Render, create a new Blueprint instance from your repository.
3) Fill required secrets in Render dashboard:

- `DATABASE_URL` (Supabase pooler URL)
- `DIRECT_URL` (Supabase direct URL)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`

4) After first deploy, run schema sync once:

```powershell
Set-Location backend
npx prisma db push
```

5) Validate deployed health endpoint:

- `https://<your-render-service>.onrender.com/api/health`
