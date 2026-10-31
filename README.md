

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
