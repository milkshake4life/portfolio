import type { Metadata } from "next";
import { Archivo, Inter, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransition from "@/components/PageTransition";
import Preloader from "@/components/Preloader";
import Nav from "@/components/Nav";
import "./styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

// Apothecary-label monospace — used only for the lightbox journal entry.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
  variable: "--font-mono-label",
});

// Case-study card display + labels.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  display: "swap",
  variable: "--font-archivo",
});

// Editorial body on the drink profile card.
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: "Ethan G.R. Lee — Product Designer",
  description:
    "Product designer crafting quiet, considered digital experiences. Brewing coffee and tea on the side.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable} ${archivo.variable} ${sourceSerif.variable}`}
    >
      <body className={inter.className}>
        <SmoothScroll>
          <PageTransition>
            <Preloader />
            <Nav />
            {children}
          </PageTransition>
        </SmoothScroll>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
