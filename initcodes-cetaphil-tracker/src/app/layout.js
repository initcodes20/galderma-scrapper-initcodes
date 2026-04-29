import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PriceTracker — Cetaphil Price Comparison",
  description:
    "Track Cetaphil product prices across Amazon, Flipkart, and Nykaa. Find the lowest price and view price history charts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} style={{ background: "var(--bg-primary)", color: "var(--text-primary)", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
        
        {/* Initcodes Watermark */}
        <footer style={{ 
          padding: "2rem 0", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          opacity: 0.6,
          marginTop: "auto"
        }}>
          <div style={{
            fontFamily: "var(--font-geist-mono), monospace",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.25rem",
            userSelect: "none"
          }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", letterSpacing: "2px" }}>
              &lt; INIT &gt;
            </div>
            <div style={{ fontSize: "0.75rem", fontWeight: "600", letterSpacing: "1px" }}>
              CODES
            </div>
          </div>
          <div style={{ fontSize: "0.7rem", marginTop: "0.5rem", opacity: 0.7 }}>
            Powered by Initcodes
          </div>
        </footer>
      </body>
    </html>
  );
}
