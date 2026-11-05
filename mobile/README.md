# Varuag OS — mobile app

React Native + Expo (SDK 58) + Expo Router + TypeScript. This build is for UI review: it runs entirely on **demo data** and is not connected to the backend or any database.

## Run it

```bash
npm install
npx expo start          # press "a" for an Android emulator, or scan the QR code with Expo Go
npx expo start --web    # browser preview
```

Sign in with one of the three demo workspaces on the sign-in screen (Admin, Team, Client). Demo emails use the password `demo1234`.

Web preview only: append `?role=admin|team|client&theme=dark|light` to any URL to open a workspace and theme directly.

## Structure

```
src/
  app/                 Expo Router screens (every file is a route)
    welcome.tsx          public home: hero, focus areas, leadership
    login.tsx
    admin/  team/  client/   role workspaces (bottom tabs)
    project/[id] milestone/[id] task/[id] invoice/[id] payment/[id]
    clients/[id] members/[id] ticket/[id] thread/[id]
    notifications settings reports updates files tasks support-desk announcements
  theme/               design tokens taken from the website's CSS (colours, type, radii, motion)
  components/          design system: Txt, Button, Card, Chips, Form, Sheet, Hero, Leadership, TabBar…
  features/            role-aware cards, list screens and form sheets
  data/                types, website content (site.ts), demo data (demo.ts)
  lib/                 progress/balance rules (same as the backend SQL views), formatting
  store/               in-memory demo store and session (replaced by API calls at integration)
assets/brand, assets/team   original website logo and leadership photos (unchanged copies)
```

## Integration notes

- Each `actions.*` in `src/store/DemoStore.tsx` maps 1:1 to an API endpoint to build.
- `src/lib/selectors.ts` mirrors `backend/migrations/002` and `004` views; once the API returns `progress_percent` and `balance_due`, the screens can read those directly.
- The app never holds a database connection string; it will only talk to the backend over HTTPS.
