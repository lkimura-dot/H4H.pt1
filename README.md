# FocusForge

FocusForge is a screen-time and focus tracker with:
- inactivity popup after 1 minute of no interaction,
- points earned from focused time,
- avatar customization shop,
<<<<<<< HEAD
- Firebase Authentication (email/password) + Firestore progress saving.

## 1) Firebase setup

1. Create a Firebase project.
2. Enable **Authentication > Email/Password**.
3. Enable **Firestore Database**.
4. Copy your web app config and update `firebase-config.js`.

### Example Firestore security rules (basic per-user isolation)

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 2) Run
=======
- backend login + saved progress for relogin.

## Run
>>>>>>> origin/main

```bash
node server.js
```

Open: http://localhost:4173

<<<<<<< HEAD
## 3) Login flow

- Register with email/password.
- Login.
- Progress automatically saves to Firestore and restores when you login again.
=======
## Account + saved data

1. Register a username/password.
2. Login.
3. Your progress is saved to the backend periodically, on key actions, and when leaving the page.
4. Login again later with the same account to restore your data.
>>>>>>> origin/main
