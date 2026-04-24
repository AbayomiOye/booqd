// app/layout.js
import './globals.css'

export const metadata = {
  title: 'Booqd — Find & Book Beauty Services in Nigeria',
  description: 'Booqd connects you with trusted beauty professionals across Nigeria. Book haircare, makeup, nails, and skincare appointments instantly.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
