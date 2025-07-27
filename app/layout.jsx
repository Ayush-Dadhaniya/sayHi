import "./globals.css"

export const metadata = {
  title: "SayHi - Connect Worldwide",
  description: "Connect with people worldwide through automatic translation",
  generator: "v0.dev",
  icons: {
    icon: [
      { url: '/tab.png', type: 'image/png', sizes: '32x32' },
      { url: '/tab.png', type: 'image/png', sizes: '16x16' }
    ]
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/tab.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/tab.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/tab.png" />
        <link rel="apple-touch-icon" href="/tab.png" />
        <link rel="shortcut icon" href="/tab.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
