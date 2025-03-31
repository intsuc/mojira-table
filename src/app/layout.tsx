import type { Metadata } from "next"
import "./globals.css"
import type { ReactNode } from "react"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Mojira Table",
  description: "An unofficial Mojira viewer in table format",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode,
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
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
