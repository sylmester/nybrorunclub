export default function TimerPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <a
        href="/admin/dashboard"
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-block"
      >
        ← Dashboard
      </a>
      <h1 className="text-3xl font-medium">Timer</h1>
      <p className="text-gray-500 mt-2">Race ID: {params.id}</p>
    </main>
  );
}
