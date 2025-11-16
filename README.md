# trackr

A cross-platform fitness and habit tracker built with React Native. Two things make this project interesting: a custom native health data bridge (Swift + Kotlin, no third-party wrappers) and an offline-first sync engine using version vectors for conflict resolution.

## The Two Hard Problems

### 1. Native Health Bridge

React Native libraries for HealthKit and Health Connect exist — but wrapping one proves nothing about native development. trackr implements custom Swift and Kotlin modules that talk directly to the platform health APIs, unified behind a single TypeScript interface. Components import `HealthBridge` and never know which OS they're running on.

Five methods, one subscription. That's the entire native surface area. See [docs/NATIVE_BRIDGE.md](docs/NATIVE_BRIDGE.md) for the full architecture.

### 2. Offline-First Sync Engine

Fitness apps that break without wifi are useless. trackr writes everything to Realm first, syncs to the server eventually, and uses version vectors (not timestamps) to detect and resolve conflicts across devices.

Version vectors encode causal ordering — they tell you whether two edits are sequential or concurrent, without relying on device clocks. When conflicts happen, resolution rules depend on data type: health readings always trust the device sensor, habit completions preserve both sides, profile edits use last-write-wins.

Full design doc: [docs/SYNC_ENGINE.md](docs/SYNC_ENGINE.md).

## Quick Start

```bash
# clone
git clone https://github.com/VanshDevChoudhary/Trackr.git
cd Trackr

# mobile
cp .env.example .env
npm install

# server (needs MongoDB)
docker compose up -d
cd server && npm install && npm run dev

# back to root — start the app
cd ..
npx expo start
```

For native health features (HealthKit / Health Connect), you need a dev build:

```bash
npx expo prebuild
npx expo run:ios    # or run:android
```

Expo Go works for everything except health data (falls back to mock provider automatically).

## Architecture

```
┌─────────────────────────────────┐
│         React Native UI         │
│  Today · Habits · Workouts · Profile
└──────────┬──────────────────────┘
           │
    ┌──────┴──────┐
    │ HealthBridge │ ← Swift (HealthKit) / Kotlin (Health Connect) / Mock
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │    Realm    │ ← All reads/writes go here first
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │ Sync Engine │ ← Version vectors, conflict resolution, background sync
    └──────┬──────┘
           │
    ┌──────┴──────┐
    │  Express API │ ← MongoDB, JWT auth
    └─────────────┘
```

Detailed docs live in [`docs/`](docs/):
- [NATIVE_BRIDGE.md](docs/NATIVE_BRIDGE.md) — health data architecture and platform differences
- [SYNC_ENGINE.md](docs/SYNC_ENGINE.md) — version vectors, conflict resolution, sync protocol
- [API_SPEC.md](docs/API_SPEC.md) — server endpoint reference
- [DB_SCHEMA.md](docs/DB_SCHEMA.md) — Realm and MongoDB schemas

## Tech Stack

| Layer | Tech |
|-------|------|
| Mobile | React Native 0.83 + Expo 55 (managed + config plugins) |
| iOS native | Swift — HealthKit via Expo Modules API |
| Android native | Kotlin — Health Connect via Expo Modules API |
| Local DB | Realm 20 |
| Navigation | React Navigation 7 (bottom tabs + native stack) |
| Server | Express.js + TypeScript |
| Database | MongoDB 7 + Mongoose |
| Auth | JWT (access + refresh tokens), bcrypt |
| Validation | Zod |
| Containerization | Docker Compose (MongoDB) |

## Known Issues / Roadmap

**Known issues:**
- Health Connect on Android requires the Health Connect app to be installed separately on some emulator images
- Step subscription on Android polls every 30s vs near-instant on iOS (Health Connect has no push API)
- Workout calorie import from Android returns 0 — needs a separate `TotalCaloriesBurnedRecord` query
- Sync is polling-based — no WebSocket real-time sync yet
- Background fetch timing is OS-controlled and unreliable on both platforms

**Roadmap (not committed to):**
- Configurable units (kg/lbs) in workout logging
- WebSocket sync for multi-device real-time updates
- Manual conflict resolution UI for edge cases
- Push notifications for habit reminders
- Export data as CSV/JSON

## License

[MIT](LICENSE)
