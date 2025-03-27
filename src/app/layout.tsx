import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import QueryProvider from "@/components/query-provider"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Mojira",
}

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="antialiased h-full overflow-hidden">
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
