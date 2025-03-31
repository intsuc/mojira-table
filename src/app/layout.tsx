import type { Metadata } from "next"
import "./globals.css"
import { Suspense, type ReactNode } from "react"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Loader2 } from "lucide-react"

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
            <Suspense fallback={
              <div className="h-full grid place-items-center">
                <Loader2 className="animate-spin text-primary" width={32} height={32} />
              </div>
            }>
              {children}
            </Suspense>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
