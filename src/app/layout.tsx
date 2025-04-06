import type { Metadata } from "next"
import "./globals.css"
import { type ReactNode } from "react"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: {
    default: "Mojira Table",
    template: "%s | Mojira Table",
  },
  description: "An unofficial table viewer for Mojira",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode,
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://bugs.mojang.com" />
        <meta name="apple-mobile-web-app-title" content="Mojira Table" />
      </head>
      <body className="h-full antialiased">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
