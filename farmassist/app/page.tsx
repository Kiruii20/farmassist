import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--mu)]">
          Nakuru County Pilot · Full-Stack Live App
        </p>
        <h1 className="text-3xl font-bold mt-1">
          AI <span className="text-[var(--pr)]">FarmAssist</span>
        </h1>
        <p className="text-[var(--mu)] mt-1">
          Choose a role to open its live view or test Mary&apos;s USSD channel.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/farmer"
          className="block rounded-2xl border-2 border-[var(--bd)] bg-[var(--sf)] p-5 hover:border-[var(--pr)] transition"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--pr)] text-[var(--prx)] font-bold text-sm mb-3">
            J
          </span>
          <h2 className="font-bold text-lg">John Mwangi</h2>
          <p className="text-sm text-[var(--mu)] mt-1">
            Farmer App · Leaf photo AI check, offline queue, EN/SW, market prices[cite: 1].
          </p>
        </Link>

        <Link
          href="/officer"
          className="block rounded-2xl border-2 border-[var(--bd)] bg-[var(--sf)] p-5 hover:border-[var(--pr)] transition"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--pr)] text-[var(--prx)] font-bold text-sm mb-3">
            G
          </span>
          <h2 className="font-bold text-lg">Grace Achieng</h2>
          <p className="text-sm text-[var(--mu)] mt-1">
            Extension Officer · Realtime case queue, AI review, Kiswahili SMS sender[cite: 1].
          </p>
        </Link>

        <div className="rounded-2xl border border-[var(--bd)] bg-[var(--sf)] p-5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--or)] text-white font-bold text-sm mb-3">
            M
          </span>
          <h2 className="font-bold text-lg">Mary Wanjiku</h2>
          <p className="text-sm text-[var(--mu)] mt-1">
            Basic Phone · Dial <b>*384*77#</b> in Africa&apos;s Talking Simulator (/api/ussd)[cite: 1].
          </p>
        </div>
      </div>
    </main>
  );
}