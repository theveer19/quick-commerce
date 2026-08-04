import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-32 text-center">
      <p className="font-display text-7xl font-extrabold text-rose">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-ivory">Page not found</h1>
      <p className="mt-2 text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 inline-flex rounded-full bg-rose text-white px-7 py-3.5 font-semibold shadow-glow">Back home</Link>
    </div>
  );
}
