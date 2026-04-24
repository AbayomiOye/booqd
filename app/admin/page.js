// app/admin/page.js
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/login')

  const [users, providers, appointments] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.provider.findMany({
      include: { user: { select: { name: true, email: true } }, _count: { select: { appointments: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.appointment.findMany({
      include: {
        client: { select: { name: true } },
        provider: { select: { businessName: true } },
        service: { select: { serviceName: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const stats = {
    users: users.length,
    providers: providers.length,
    appointments: appointments.length,
    revenue: appointments
      .filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + (a.service?.price || 0), 0),
  }

  const statusColors = { PENDING:'badge-yellow', CONFIRMED:'badge-green', CANCELLED:'badge-red', COMPLETED:'badge-gray' }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-500 mb-8">Platform overview and management</p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Users', value: stats.users, icon: '👤' },
            { label: 'Providers', value: stats.providers, icon: '💼' },
            { label: 'Appointments', value: stats.appointments, icon: '🗓' },
            { label: 'Revenue (completed)', value: `₦${stats.revenue.toLocaleString()}`, icon: '💰' },
          ].map(s => (
            <div key={s.label} className="card p-5">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Providers table */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Providers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Business</th>
                    <th className="pb-2 font-medium">Location</th>
                    <th className="pb-2 font-medium">Bookings</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {providers.map(p => (
                    <tr key={p.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-gray-900">{p.businessName}</p>
                        <p className="text-xs text-gray-400">{p.user.email}</p>
                      </td>
                      <td className="py-2.5 text-gray-600">{p.location}</td>
                      <td className="py-2.5 text-gray-600">{p._count.appointments}</td>
                      <td className="py-2.5">
                        <span className={p.verified ? 'badge-green' : 'badge-yellow'}>
                          {p.verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent appointments */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Recent Appointments</h2>
            <div className="space-y-3">
              {appointments.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{a.client.name}</p>
                    <p className="text-xs text-gray-500">
                      {a.service.serviceName} @ {a.provider.businessName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(a.apptDate).toLocaleDateString('en-NG', { day:'numeric', month:'short' })}
                    </p>
                  </div>
                  <span className={statusColors[a.status] || 'badge-gray'}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Users table */}
        <div className="card p-6 mt-8">
          <h2 className="font-bold text-gray-900 mb-4">All Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="py-2.5 font-medium text-gray-900">{u.name}</td>
                    <td className="py-2.5 text-gray-600">{u.email}</td>
                    <td className="py-2.5">
                      <span className={u.role === 'ADMIN' ? 'badge-purple' : u.role === 'PROVIDER' ? 'badge-green' : 'badge-gray'}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
