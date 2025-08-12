# trackr

Cross-platform fitness & habit tracker built with React Native. Tracks workouts, habits, and health data from HealthKit (iOS) and Health Connect (Android) through a unified native bridge.

The interesting parts: offline-first sync engine with version vector conflict resolution, and Swift/Kotlin native modules bridged to a single TypeScript interface.

## Quick start

```bash
# Mobile
npm install
npx expo start

# Server
cd server && npm install
docker compose up -d   # MongoDB
npm run dev
```

You need `expo-dev-client` for native modules — Expo Go won't work once the health bridge lands.

## Project layout

```
src/
  app/          screens (Today, Habits, Workouts, Profile)
  bridges/      health data interface (HealthKit + Health Connect)
  sync/         offline sync engine, version vectors
  db/           Realm schema and provider
  types/        shared TypeScript types

server/
  src/
    routes/     Express endpoints
    models/     Mongoose schemas
    middleware/  auth, validation
    services/   business logic

docs/           architecture decisions, specs
```

## Stack

- **Mobile**: React Native + Expo, Realm (local DB), Swift (HealthKit), Kotlin (Health Connect)
- **Server**: Express.js + TypeScript, MongoDB + Mongoose, JWT auth
- **Infra**: Docker, GitHub Actions CI

## Known Issues / Roadmap

- [ ] Realm + Expo compatibility needs `expo-dev-client` — can't use Expo Go
- [ ] Health bridge not yet implemented (placeholder interface only)
- [ ] Sync engine conflict resolution not wired up
- [ ] No push notifications for habit reminders
- [ ] Weight unit conversion (kg/lbs) not handled yet
