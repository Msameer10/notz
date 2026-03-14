# Notz

Notz is a production-minded note-taking app built with Next.js App Router, React, TypeScript, Tailwind CSS, Firebase Authentication, and Firestore.

## Local Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the Firebase web app values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

All six variables are required. The app now fails fast with a clear error if any are missing.

These same variables must also be configured in Vercel for production deployments.

## Firebase Assumptions

This app assumes the following Firebase setup:

- Google is the only configured sign-in provider used by the app UI.
- Firebase Authentication has the local dev domain and deployed Vercel domains listed under Authorized domains.
- Firestore is enabled in native mode.
- User data lives under `users/{uid}/notes/{noteId}` and `users/{uid}/board/{itemId}`.
- The client can read and write only the signed-in user's own subtree.

## Firestore Rules

A baseline rules example is included in [`firestore.rules`](./firestore.rules). It matches the current app structure:

- `users/{uid}/notes/{noteId}` for notes
- `users/{uid}/board/{itemId}` for board items

Recommended rule shape:

```text
Allow read/write only when request.auth.uid == uid.
```

If you use the provided rules file, review it before deploying and publish it with the Firebase CLI or Firebase console.

## Deployment Checklist

Before deploying to Vercel:

1. Create a Firebase web app and confirm the web config matches your environment variables.
2. Enable Google Authentication in Firebase Authentication > Sign-in method.
3. Add all required domains in Firebase Authentication > Settings > Authorized domains.
   Include at least `localhost`, your Vercel production domain, and any preview domains you intend to use.
4. Create Firestore in native mode.
5. Publish Firestore rules that restrict access to each user's own `users/{uid}` subtree.
6. Add all `NEXT_PUBLIC_FIREBASE_*` variables in Vercel Project Settings.
7. Run the validation commands below before shipping.

## Deployment Notes

- Vercel should use the same `NEXT_PUBLIC_FIREBASE_*` values as local development.
- This app uses system/local font stacks instead of remote Google font fetching, so `npm run build` works in offline or restricted CI environments.
- Firebase console settings such as authorized domains and Firestore rules are required in addition to environment variables.
- Preview deployments can fail Google sign-in if their domains are not added to Firebase Authorized domains.

## Validation

Useful checks before deploying:

```bash
npm run lint
npx tsc --noEmit
npm run build
```
