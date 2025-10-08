import Footer from "./components/footer";
import Navbar from "./components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Navbar />
        {/* Your main content goes here */}
        <div className="container mx-auto px-4 py-16 ">
        </div>
      </main>
      <Footer />
    </div>
  );
}
