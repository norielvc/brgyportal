# BrgyDesk Admin Mobile App (iOS & Android)

A native cross-platform mobile application engineered exclusively for **Barangay Captains, Secretaries, Treasurers, Kagawads, and Field Officers**.

---

## 📱 Features

1. **Native Camera QR Scanner & Claim Verification**:
   - High-speed QR scanner with viewfinder overlay, torchlight toggle, and haptic feedback.
   - Instantly looks up certificate claim slips and resident QR IDs.
   - 1-Tap "Confirm Release & Handover" button.

2. **Certificate Approval Hub**:
   - Filter by `Pending`, `Under Review`, `Approved`, `Released`, `Rejected`.
   - Complete document inspection (applicant info, stated purpose, uploaded valid IDs).
   - Instant workflow actions: **Approve & Assign Official Receipt (OR) Number**, **Send Back for Revision**, or **Reject**.

3. **E-Sumbong & Blotter Incident Management**:
   - Incident queue with priority badges (`High`, `Medium`, `Low`).
   - Complainant and respondent information, location, and full narrative.
   - Record hearing schedules and mediation agreement notes.

4. **Resident Master Directory**:
   - Fast resident search by name, street, or purok.
   - Resident profile card with demographic tags (`Registered Voter`, `Senior Citizen`, `PWD`, `4Ps Beneficiary`, `Solo Parent`).
   - Instant 1-Tap **Call** and **SMS** triggers directly from phone.

5. **KapChat Admin Messenger**:
   - Real-time resident inquiry messaging with unread count badges.
   - One-tap quick response chips for fast customer service.

6. **Security & Preferences**:
   - **Biometric Authentication**: Fast login via Face ID, Touch ID, or Android Fingerprint (`expo-local-authentication`).
   - **Multi-Tenant Switching**: Easily toggle between barangays (e.g., `ibaoeste`, `demo`).
   - **Dark & Light Mode**: Tailored emerald & slate aesthetic with automatic system theme syncing.
   - **Dynamic API Base URL**: Easily switch between local development (`localhost` / `10.0.2.2` / LAN IP) and production server.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start Expo Development Server
```bash
npm run start
```
From the Expo interactive terminal:
- Press `i` to open in **iOS Simulator** (Mac/Xcode)
- Press `a` to open in **Android Emulator** (Android Studio)
- Press `w` to open in **Web Browser**
- Scan the printed QR code with the **Expo Go** app on your physical iPhone or Android device!

---

## 📦 Building Native Binaries (iOS `.ipa` & Android `.apk`)

Using EAS (Expo Application Services):

### Build Android APK (Direct install on Android phones):
```bash
npx eas build -p android --profile preview
```

### Build iOS (.ipa for TestFlight / App Store):
```bash
npx eas build -p ios --profile production
```

---

## ⚙️ Project Structure

```
mobile/
├── App.tsx                     # Root App container & providers
├── app.json                    # Expo config (iOS bundle ID, Android package, permissions)
├── package.json
├── src/
│   ├── api/                    # API client with JWT and multi-tenant interceptors
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── certificates.ts
│   │   ├── residents.ts
│   │   ├── blotter.ts
│   │   ├── scanner.ts
│   │   └── kapchat.ts
│   ├── components/             # Reusable UI components (Header, StatCard, Badge, Button, Card, SearchBar, EmptyState)
│   ├── context/                # AuthContext (Biometrics, JWT, Tenant) & ThemeContext
│   ├── navigation/             # TabNavigator & AppNavigator
│   ├── screens/                # Mobile App Screens (Dashboard, Scanner, Certificates, Blotter, Residents, KapChat, Settings)
│   └── theme/                  # Design tokens & color palettes
```
