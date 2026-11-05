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
  lib/                 progress/balance rules and formatting
  store/               in-memory demo store and local demo session
assets/brand, assets/team   original website logo and leadership photos (unchanged copies)
```

## Data

All screens and form actions use the in-memory demo store. Changes reset when the app reloads. The backend is currently a database-free placeholder and is not used by this UI build.
