import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme-provider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Standpoint — Anonymous Debate Board',
  description: 'Browse debates anonymously. Sign in only to write, vote, and suggest topics.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* Changed body classes:
        - Set the default base background to the deep board mahogany color (#3e2723)
        - Set default text colors to a clear amber tint (#fffbeb) so any unstyled pages are legible
      */}
      <body className="min-h-full flex flex-col bg-[#3e2723] text-[#fffbeb] selection:bg-amber-700 selection:text-amber-100 antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}