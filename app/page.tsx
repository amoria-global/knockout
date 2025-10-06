import Footer from "./components/footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Your main content goes here */}
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center">
            Welcome to Amoria Connekt
          </h1>
        </div>
      </main>

      <Footer />
    </div>
  );
}
