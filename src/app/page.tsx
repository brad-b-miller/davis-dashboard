import Image from "next/image";

export default function Home() {
  // Place your main home page content here
  return (
    <main className="w-full max-w-full">
      {/* Example content: replace with your actual home page UI */}
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="Dashboard Logo" width={32} height={32} className="h-8 w-8" />
          <h1 className="text-lg font-semibold text-white sm:text-xl">Signal vs. Noise</h1>
        </div>
      </header>
      {/* Add your main dashboard or home content here */}
      <div className="p-4 text-white">Welcome to the dashboard home page.</div>
    </main>
  );
}
