import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Luca Zani - Backend Developer | OverloadedTech",
  description:
    "Personal portfolio of Luca Zani (OverloadedTech) - Backend Developer specializing in Python, Node.js, C++, and Rust. Explore my projects and connect for collaborations.",
  keywords: "Luca Zani, OverloadedTech, Backend Developer, Python, Node.js, C++, Rust, Software Engineer",
  authors: [{ name: "Luca Zani" }],
  creator: "Luca Zani",
  openGraph: {
    title: "Luca Zani - Backend Developer | OverloadedTech",
    description: "Backend Developer specializing in Python, Node.js, C++, and Rust",
    url: "https://lucazani.com",
    siteName: "OverloadedTech",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luca Zani - Backend Developer | OverloadedTech",
    description: "Backend Developer specializing in Python, Node.js, C++, and Rust",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
              }
              
              // Force scroll to top on every page load
              window.addEventListener('beforeunload', function() {
                window.scrollTo(0, 0);
              });
              
              // Force scroll to top immediately
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-900 text-gray-100 min-h-screen`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Additional scroll to top after body loads
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
            `,
          }}
        />
        {children}
      </body>
    </html>
  )
}
