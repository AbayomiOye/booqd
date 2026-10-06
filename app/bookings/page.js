import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/Navbar'
import BookingList from './BookingList'

export default async function BookingsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const bookings = await prisma.appointment.findMany({
    where: { clientId: session.id },
    include: { provider: { select: { businessName: true, location: true } } },
    orderBy: { apptDate: 'desc' },
  })
  return <div className="min-h-screen bg-gray-50"><Navbar />
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">My bookings</h1>
      <p className="text-gray-500 mb-6">Your saved appointments. All times are Nigeria time (WAT).</p>
      <BookingList initialBookings={JSON.parse(JSON.stringify(bookings))} />
    </main>
  </div>
}
