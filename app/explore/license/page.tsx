import type { Metadata } from "next";
import Link from "next/link";
import "../explore.css";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

export const metadata: Metadata = {
  title: "Standard license · Connekyt Explore",
  alternates: { canonical: "/explore/license" },
  description: "What you can and cannot do with photos and clips bought on Connekyt Explore.",
};

export default function LicensePage() {
  return (
    <>
    <Navbar />
    <main className="xp">
      <div className="xp-wrap" style={{ maxWidth: 760, paddingTop: 24 }}>
        <p className="xp-meta"><Link href="/explore" style={{ color: "var(--xp-pink-text)" }}>Explore</Link></p>
        <h1 style={{ fontSize: 36, margin: "0 0 8px" }}>Standard license</h1>
        <p className="xp-meta" role="note" style={{ border: "1px solid var(--xp-line)", borderRadius: 12, padding: 12, background: "var(--xp-input)" }}>
          Draft text, pending legal review. It describes how Explore purchases are meant to be used and does not replace the
          Terms of Service.
        </p>
        <h2>What you can do</h2>
        <ul>
          <li>Use the photo or clip for personal purposes.</li>
          <li>Post it on your own social media accounts and in stories, with the creator credited where the platform allows.</li>
          <li>Show it in non-commercial presentations.</li>
        </ul>
        <h2>What you cannot do</h2>
        <ul>
          <li>Resell, share or redistribute the file, alone or inside a pack.</li>
          <li>Use it in paid advertising or on products you sell.</li>
          <li>Print it for sale.</li>
          <li>Use it to train an AI model.</li>
        </ul>
        <h2>Ownership</h2>
        <p>The creator keeps the copyright. You buy a license to use one file under these terms, for as long as you have the file.</p>
        <h2>Downloads</h2>
        <p>Your download link works for 7 days and up to 5 downloads. If it expires, use &ldquo;I already bought this&rdquo; or Recover purchases on Explore to get a new one.</p>
        <h2>Questions</h2>
        <p>Write to <a href="mailto:support@connekyt.com" style={{ color: "var(--xp-pink-text)" }}>support@connekyt.com</a>.</p>
      </div>
    </main>
    <Footer />
    </>
  );
}
