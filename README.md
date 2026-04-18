# pitch-er_perfect_2.0

A pitching competition web app with team login, domain selection, bidding flow, and an admin dashboard backed by Firebase Authentication and Firestore.

## Firebase deployment

This repo is now set up for Firebase Hosting and Firestore deployment with:

- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `firestore.indexes.json`

### 1. Install the Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Log in to Firebase

```bash
firebase login
```

### 3. Confirm the active project

```bash
firebase use pitch-er-perfect-2
```

### 4. Deploy Hosting and Firestore config

```bash
firebase deploy
```

### 5. Deploy only the website

```bash
firebase deploy --only hosting
```

### 6. Deploy only Firestore rules and indexes

```bash
firebase deploy --only firestore
```

### Local preview

```bash
firebase emulators:start
```
