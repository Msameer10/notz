"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

type AuthMode = "signin" | "signup";

type AuthAction = "google" | "github" | "email-signin" | "email-signup" | null;

type AuthHeroProps = {
  authError: string | null;
  loadingAction: AuthAction;
  onClearAuthError: () => void;
  onEmailSignIn: (email: string, password: string, rememberDevice: boolean) => Promise<void>;
  onEmailSignUp: (email: string, password: string, rememberDevice: boolean) => Promise<void>;
  onGithubLogin: (rememberDevice: boolean) => Promise<void>;
  onGoogleLogin: (rememberDevice: boolean) => Promise<void>;
};

const premiumEase = "cubic-bezier(0.22, 1, 0.36, 1)";
const introDurationMs = 860;
const choiceDurationMs = 620;
const modalDurationMs = 360;

export default function AuthHero({
  authError,
  loadingAction,
  onClearAuthError,
  onEmailSignIn,
  onEmailSignUp,
  onGithubLogin,
  onGoogleLogin,
}: AuthHeroProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [introReady, setIntroReady] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const readyTimer = window.setTimeout(() => setIntroReady(true), 40);
    const choiceTimer = window.setTimeout(() => setShowChoices(true), 1040);

    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(choiceTimer);
    };
  }, []);

  const isBusy = loadingAction !== null;

  const openModal = (nextMode: AuthMode) => {
    setMode(nextMode);
    setIsModalOpen(true);
    onClearAuthError();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    onClearAuthError();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === "signin") {
      await onEmailSignIn(email, password, rememberDevice);
      return;
    }

    await onEmailSignUp(email, password, rememberDevice);
  };

  const triggerGoogle = async () => {
    await onGoogleLogin(rememberDevice);
  };

  const triggerGithub = async () => {
    await onGithubLogin(rememberDevice);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-14 sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: "radial-gradient(circle at 50% 28%, color-mix(in srgb, var(--card-2) 80%, transparent) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 w-full max-w-3xl text-center">
        <div
          className="mx-auto max-w-xl transition-all"
          style={{
            opacity: introReady ? 1 : 0,
            transform: introReady ? "translateY(0)" : "translateY(32px)",
            transitionTimingFunction: premiumEase,
            transitionDuration: `${introDurationMs}ms`,
          }}
        >
          <h1
            className="brand-glow text-6xl font-bold tracking-tight md:text-8xl"
            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          >
            Notz
          </h1>

          <div
            className="mt-4 transition-all"
            style={{
              opacity: showChoices ? 0 : 1,
              transform: showChoices ? "translateY(-10px)" : "translateY(0)",
              pointerEvents: showChoices ? "none" : "auto",
              transitionTimingFunction: premiumEase,
              transitionDuration: `${choiceDurationMs}ms`,
            }}
          >
            <div className="text-base" style={{ color: "var(--muted)" }}>
              x
            </div>

            <a
              href="https://sameerion.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-2xl transition hover:opacity-80 md:text-3xl"
              style={{
                color: "var(--fg)",
                fontFamily: "var(--font-cinzel), serif",
                letterSpacing: "0.06em",
              }}
            >
              Sameerion
            </a>
          </div>

          <div
            className="mx-auto mt-8 max-w-md rounded-[28px] border p-4 shadow-sm backdrop-blur-sm transition-all sm:p-5"
            style={{
              opacity: showChoices ? 1 : 0,
              transform: showChoices ? "translateY(0) scale(1)" : "translateY(18px) scale(0.98)",
              transitionTimingFunction: premiumEase,
              transitionDuration: `${choiceDurationMs}ms`,
              background: "color-mix(in srgb, var(--card) 88%, transparent)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow)",
              pointerEvents: showChoices ? "auto" : "none",
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openModal("signin")}
                className="button-primary rounded-2xl border px-4 py-3 text-sm font-medium transition"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => openModal("signup")}
                className="button-neutral rounded-2xl border px-4 py-3 text-sm font-medium transition"
              >
                Sign up
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={triggerGoogle}
                disabled={isBusy}
                className="flex items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                style={{ background: "var(--card-2)", borderColor: "var(--border)" }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.86-6.86C35.92 2.36 30.32 0 24 0 14.64 0 6.6 5.4 2.6 13.28l8.02 6.22C12.5 13.3 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.1 24.55c0-1.64-.15-3.21-.43-4.73H24v9h12.42c-.54 2.9-2.17 5.36-4.63 7.02l7.2 5.6C43.97 37.08 46.1 31.37 46.1 24.55z" />
                  <path fill="#FBBC05" d="M10.62 28.72a14.5 14.5 0 010-9.44l-8.02-6.22A23.97 23.97 0 000 24c0 3.87.92 7.54 2.6 10.94l8.02-6.22z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.92-2.14 15.9-5.82l-7.2-5.6c-2 1.35-4.56 2.15-8.7 2.15-6.26 0-11.5-3.8-13.38-9.1l-8.02 6.22C6.6 42.6 14.64 48 24 48z" />
                </svg>
                <span>{loadingAction === "google" ? "Connecting..." : "Google"}</span>
              </button>

              <button
                type="button"
                onClick={triggerGithub}
                disabled={isBusy}
                className="flex items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                style={{ background: "var(--card-2)", borderColor: "var(--border)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.1 3.3 9.42 7.88 10.95.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.71.08-.71 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.67 1.25 3.32.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.19-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.77.12 3.06.74.8 1.18 1.82 1.18 3.08 0 4.42-2.68 5.39-5.24 5.67.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.53 11.53 0 0 0 23.5 12C23.5 5.66 18.35.5 12 .5Z" />
                </svg>
                <span>{loadingAction === "github" ? "Connecting..." : "GitHub"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-0 z-30 flex items-center justify-center px-5 transition-opacity"
        style={{
          opacity: isModalOpen ? 1 : 0,
          pointerEvents: isModalOpen ? "auto" : "none",
          background: "color-mix(in srgb, var(--bg) 54%, transparent)",
          backdropFilter: isModalOpen ? "blur(10px)" : "blur(0px)",
          transitionDuration: `${modalDurationMs}ms`,
        }}
        onClick={closeModal}
      >
        <div
          className="w-full max-w-md rounded-[32px] border p-5 shadow-2xl transition-all sm:p-6"
          style={{
            opacity: isModalOpen ? 1 : 0,
            transform: isModalOpen ? "translateY(0) scale(1)" : "translateY(18px) scale(0.94)",
            transitionTimingFunction: premiumEase,
            transitionDuration: `${modalDurationMs}ms`,
            background: "color-mix(in srgb, var(--card) 94%, transparent)",
            borderColor: "var(--border)",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.28)",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {mode === "signin" ? "Pick up where you left off." : "Start your notes with a clean, secure setup."}
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="button-neutral inline-flex h-10 w-10 items-center justify-center rounded-full border text-lg leading-none transition"
              aria-label="Close auth dialog"
            >
              x
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl p-1" style={{ background: "var(--card-2)" }}>
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                onClearAuthError();
              }}
              className="rounded-xl px-3 py-2 text-sm font-medium transition-colors"
              style={mode === "signin" ? { background: "var(--bg)", color: "var(--fg)" } : { color: "var(--muted)" }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                onClearAuthError();
              }}
              className="rounded-xl px-3 py-2 text-sm font-medium transition-colors"
              style={mode === "signup" ? { background: "var(--bg)", color: "var(--fg)" } : { color: "var(--muted)" }}
            >
              Sign up
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={triggerGoogle}
              disabled={isBusy}
              className="flex items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: "var(--card-2)", borderColor: "var(--border)" }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.86-6.86C35.92 2.36 30.32 0 24 0 14.64 0 6.6 5.4 2.6 13.28l8.02 6.22C12.5 13.3 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.55c0-1.64-.15-3.21-.43-4.73H24v9h12.42c-.54 2.9-2.17 5.36-4.63 7.02l7.2 5.6C43.97 37.08 46.1 31.37 46.1 24.55z" />
                <path fill="#FBBC05" d="M10.62 28.72a14.5 14.5 0 010-9.44l-8.02-6.22A23.97 23.97 0 000 24c0 3.87.92 7.54 2.6 10.94l8.02-6.22z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.92-2.14 15.9-5.82l-7.2-5.6c-2 1.35-4.56 2.15-8.7 2.15-6.26 0-11.5-3.8-13.38-9.1l-8.02 6.22C6.6 42.6 14.64 48 24 48z" />
              </svg>
              <span>{loadingAction === "google" ? "Connecting..." : "Google"}</span>
            </button>

            <button
              type="button"
              onClick={triggerGithub}
              disabled={isBusy}
              className="flex items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: "var(--card-2)", borderColor: "var(--border)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.1 3.3 9.42 7.88 10.95.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.71.08-.71 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.67 1.25 3.32.95.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.19-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.77.12 3.06.74.8 1.18 1.82 1.18 3.08 0 4.42-2.68 5.39-5.24 5.67.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56A11.53 11.53 0 0 0 23.5 12C23.5 5.66 18.35.5 12 .5Z" />
              </svg>
              <span>{loadingAction === "github" ? "Connecting..." : "GitHub"}</span>
            </button>
          </div>

          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
            <span>Email</span>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>

          <form className="grid gap-3" onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
              disabled={isBusy}
              className="rounded-2xl border px-4 py-3 outline-none transition"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              disabled={isBusy}
              className="rounded-2xl border px-4 py-3 outline-none transition"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
            />

            <label className="mt-1 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border"
              />
              <span style={{ color: "var(--muted)" }}>Keep me signed in on this device</span>
            </label>

            {authError ? (
              <p className="text-sm" style={{ color: "#d66a6a" }}>
                {authError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isBusy || !email || !password}
              className="button-primary rounded-2xl border px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingAction === "email-signin" || loadingAction === "email-signup"
                ? "Please wait..."
                : mode === "signin"
                  ? "Sign in with email"
                  : "Create account"}
            </button>

            {mode === "signup" ? (
              <p className="text-center text-xs leading-5" style={{ color: "var(--muted)" }}>
                By creating an account, you agree to the{" "}
                <Link href="/terms" className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">
                  Terms & Conditions
                </Link>
                .
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}