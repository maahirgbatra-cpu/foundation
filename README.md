

## Create the first Super Admin (one-time manual bootstrap)

Do this only after enabling Email/Password in Firebase Authentication:

1. Firebase Console → **Authentication → Users → Add user**.
2. Enter the intended Super Admin email and a strong temporary password. Save the user.
3. Open the new user row and copy its **UID**.
4. Firestore Database → **Data → Start collection**.
5. Collection ID: `users`.
6. Document ID: paste the exact Firebase Authentication UID.
7. Add these fields:
   - `name` — string — administrator's display name
   - `role` — string — `super_admin`
   - `active` — boolean — `true`
8. Save the document.
9. Publish the included `firestore.rules` in Firestore → Rules.
10. Sign in to the app using the same email/password and select **Super Admin**.

Do not create a `users` document with a random ID: it must exactly match the Authentication UID. Keep the initial password private and change it after the first sign-in.

## Current scope / next engineering task

The first-admin bootstrap above is manual because it is a controlled one-time operation. The next step is a trusted provisioning backend for Super Admin-created staff and teacher-created student accounts. It must use the Firebase Admin SDK on a trusted server, verify the caller's role, and never expose service-account credentials in the browser. Automated Cloud Functions deployment may require enabling billing depending on the Firebase product/region; check the current project plan before choosing that route.

## Android app (Capacitor)

The Android wrapper uses the existing root `index.html` portal as its bundled web app. Firebase remains online; the APK does not contain a local database.

### Build a debug APK on Windows

1. Install **Node.js 22 LTS** and **Android Studio** (including the Android SDK).
2. Download or clone this repository and open a terminal in the project folder.
3. Run:

   ```bash
   npm install
   npm run android:setup
   npm run android:sync
   npm run android:open
   ```

4. In Android Studio, let Gradle finish syncing. Select **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
5. The debug APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

To rebuild after website changes, run `npm run android:sync` and build the APK again.

### Build from GitHub Actions

Open **Actions → Build Android APK → Run workflow**. When the workflow finishes, download the `foundation-classes-debug-apk` artifact. It contains the installable debug APK.

### App identity

- App name: **Foundation Classes**
- Android application ID: `com.foundationclasses.portal`
- Capacitor web directory: `dist`

The first build needs an internet connection to download Android/Gradle dependencies. A debug APK is for testing and direct installation; a Play Store release needs a separately signed release build. Keep signing keys private.

### Firebase note

The app continues to use the existing Firebase Authentication and Firestore project. Test sign-in, reading/writing data, and file uploads on a real Android device. If you later add Google sign-in or other OAuth providers, configure and test their Android-specific package/SHA fingerprints and native flow separately.
