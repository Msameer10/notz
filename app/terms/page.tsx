import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-3xl rounded-[32px] border p-6 shadow-sm sm:p-8" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              Notz
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Terms & Conditions</h1>
          </div>
          <Link href="/" className="button-neutral rounded-xl border px-4 py-2 text-sm transition">
            Back
          </Link>
        </div>

        <div className="mt-8 space-y-6 text-sm leading-7 sm:text-[15px]" style={{ color: "var(--muted)" }}>
          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--fg)" }}>Use of Notz</h2>
            <p className="mt-2">
              Notz is provided as a personal note-taking product. You are responsible for the information you create,
              store, and manage in your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--fg)" }}>Accounts</h2>
            <p className="mt-2">
              You are responsible for maintaining the security of your account and for any activity performed through it.
              If you believe your account has been accessed without permission, sign out of your devices and reset access
              through your authentication provider.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--fg)" }}>Content</h2>
            <p className="mt-2">
              You retain ownership of the notes and board content you create in Notz. You should avoid storing unlawful,
              harmful, or sensitive information unless you are comfortable with the risks of cloud storage.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--fg)" }}>Availability</h2>
            <p className="mt-2">
              We aim to keep Notz available and reliable, but the service may occasionally be unavailable for maintenance,
              updates, or provider issues outside our control.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold" style={{ color: "var(--fg)" }}>Changes</h2>
            <p className="mt-2">
              These terms may be updated over time. Continued use of Notz after changes are published means you accept the
              updated terms.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
