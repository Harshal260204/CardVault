# CardVault Mobile

Expo SDK **54** (React Native) app for **field sales** — employees capture and manage business cards. Requires **Expo Go for SDK 54** on your phone.

Managers and super admins use the **WEB** console instead.

## Setup

```powershell
cd MOBILE
cp .env.example .env
npm install
npm start
```

Set `EXPO_PUBLIC_API_URL` to your API host **without** `/api/v1`:

- iOS simulator: `http://localhost:8000`
- Android emulator: `http://10.0.2.2:8000`
- Physical device: your machine LAN IP, e.g. `http://192.168.1.10:8000`

Ensure the API is running and reachable from the device.

## Demo login

| Email | Password | Role |
|-------|----------|------|
| employee@cardvault.local | Password123! | employee |

## Card capture logs

Scan / OCR events log to the Metro terminal with the prefix `[CardCapture]` (image pick, upload, job status, confirm). Keep `npx expo start` visible while testing captures.

## Screens

- **Home** — active sessions and recent contacts
- **Contacts** — search and open contact detail
- **Scan** — camera/gallery upload → OCR review
- **Profile** — account info and sign out
