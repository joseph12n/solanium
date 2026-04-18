import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight">Solanium</h1>
        <p className="text-ink-300 text-lg">
          Facturación universal. Un mismo motor para papelerías, carnicerías y electrónica.
        </p>
        <Link
          href="/inventario"
          className="inline-block px-5 py-2.5 rounded-full bg-ink-100 text-ink-950 font-medium hairline-hover transition"
        >
          Abrir dashboard de inventario →
        </Link>
      </div>
    </main>
  );
}
