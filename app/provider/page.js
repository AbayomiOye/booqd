// app/provider/page.js
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import ProviderDashboardClient from './ProviderDashboardClient'

export default async function ProviderDashboard() {
  const session = await getSession()
  if (!session || session.role !== 'PROVIDER') redirect('/login')

  const provider = await prisma.provider.findUnique({
    where: { userId: session.id },
    include: {
      services: { orderBy: { price: 'asc' } },
      portfolios: true,
      appointments: {
        include: {
          client: { select: { name: true, email: true } },
          service: true,
        },
        orderBy: { apptDate: 'asc' },
        take: 20,
      },
    },
  })

  if (!provider) redirect('/')

  const stats = {
    total: provider.appointments.length,
    pending: provider.appointments.filter(a => a.status === 'PENDING').length,
    confirmed: provider.appointments.filter(a => a.status === 'CONFIRMED').length,
    completed: provider.appointments.filter(a => a.status === 'COMPLETED').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">{provider.businessName} · {provider.location}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: 'Confirmed', value: stats.confirmed, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Completed', value: stats.completed, color: 'text-brand-700', bg: 'bg-brand-50' },
          ].map(stat => (
            <div key={stat.label} className={`card p-5 ${stat.bg}`}>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <ProviderDashboardClient
          provider={JSON.parse(JSON.stringify(provider))}
          providerId={provider.id}
        />
      </div>
    </div>
  )
}
