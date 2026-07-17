# Streamline

Streamline is a voice-chat and live-streaming social app built with React Native — think Halla/MegaChat-style rooms, party spaces, and live discovery, wrapped in a teal "premium lounge" brand identity.

## Tech stack

- **React Native** 0.86 (bare CLI, not Expo)
- **React Navigation** — native-stack for the root flow, bottom-tabs for the main app shell (with a fully custom notch-style tab bar)
- **Zustand** for app/session state, persisted via **MMKV**
- **React Query** for future data fetching
- **react-hook-form** + **zod** (available for form validation)
- **react-native-svg** for all custom icons
- **react-native-video** for background video (Splash/Auth screens)
- TypeScript throughout

## Getting started

Install dependencies:

```sh
npm install
```

Start Metro:

```sh
npm start
```

Run on Android (in a separate terminal, with Metro running):

```sh
npm run android
```

> This project uses a peer-dependency combination (React 19 + `react-native-fast-image`) that currently requires `--legacy-peer-deps` on fresh installs.

## App structure

```
src/
  api/            Mock/temporary auth API (src/api/auth.ts) — swap for real backend calls
  assets/         Icons (SVG), logo image, background video
  components/      Shared UI: Screen, FormField, PrimaryButton, TermsCheckbox, VideoBackground, BrandMark
  config/         Environment/demo config (src/config/env.ts)
  navigation/     Root stack (AppNavigator), bottom tabs (MainTabNavigator), custom tab bar (CustomTabBar)
  screens/        One folder per screen (Splash, Auth, PhoneAuth, SignupDetails, Onboarding, Home, Discover, Family, Message, Profile, Room, TermsAndConditions)
  store/          Zustand store + MMKV persistence
  theme/          Central theme tokens (src/theme/theme.ts) — always pull colors from here, never hardcode hex in screens
  types/          Shared TypeScript types
```

## Current flow

1. **Splash** → checks persisted session → routes to Auth, Onboarding, or Home.
2. **Auth** → Google/Facebook (mocked) or phone sign-in.
3. **PhoneAuth** → OTP verification (demo OTP: `123456`). Known demo numbers can either go straight to Home or through the full Signup → Onboarding flow, controlled by `appEnv.demoVisualizeFullFlow` in `src/config/env.ts` (useful for QA-ing the whole chain).
4. **SignupDetails** → collects profile details for new numbers.
5. **Onboarding** → avatar/gender selection.
6. **Home** (bottom tabs: Home, Discover, Family, Message, Me) → Home has Live / Party / Games sub-tabs, swipeable, with a live-room grid, country filters, and an auto-looping party banner carousel.

## Release builds

```sh
npm run apk:release          # gradlew assembleRelease
npm run apk:release:clean    # clean build first
npm run apk:release:dry-run  # print the commands without running them
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

## Notes

- Auth/signup logic in `src/api/auth.ts` is a temporary mock (no real backend yet) — identifiers/passwords are checked against `src/config/env.ts`.
- Colors must always come from `src/theme/theme.ts` — add new tokens there rather than hardcoding hex values in a screen.

