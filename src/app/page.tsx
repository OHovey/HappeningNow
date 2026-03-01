export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">HappeningNow</h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Explore what&apos;s happening around the world. Festivals, wildlife
          spectacles, and crowd levels on an animated timeline map.
        </p>
      </main>
    </div>
  );
}
