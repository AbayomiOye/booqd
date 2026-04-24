// app/providers/[id]/page.js
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import BookingForm from './BookingForm'

export default async function ProviderPage({ params }) {
  const provider = await prisma.provider.findUnique({
    where: { id: parseInt(params.id) },
    include: {
      user: { select: { name: true, email: true } },
      services: { orderBy: { price: 'asc' } },
      portfolios: true,
      _count: { select: { appointments: true } },
    },
  })
  if (!provider) notFound()

  const session = await getSession()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Cover + Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center text-3xl shrink-0">
              {provider.category === 'Nails' ? '💅' : provider.category === 'Skincare' ? '✨' : provider.category === 'Lashes' ? '👁️' : '💄'}
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{provider.businessName}</h1>
                  <p className="text-gray-500 mt-1">📍 {provider.location} · 📞 {provider.phone}</p>
                </div>
                {provider.verified && (
                  <span className="badge-green mt-1">✓ Verified</span>
                )}
              </div>
              <p className="text-gray-600 mt-3 max-w-2xl">{provider.description}</p>
              <div className="flex gap-4 mt-4 text-sm text-gray-500">
                <span>🗓 {provider._count.appointments} bookings</span>
                <span className="badge-purple">{provider.category}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-3 gap-8">
        {/* Left: Services + Portfolio */}
        <div className="lg:col-span-2 space-y-8">
          {/* Services */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Services & Pricing</h2>
            <div className="divide-y divide-gray-50">
              {provider.services.map(service => (
                <div key={service.id} className="py-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.serviceName}</h3>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">⏱ {service.durationMin} minutes</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-brand-700">₦{service.price.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio */}
          {provider.portfolios.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Portfolio</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {provider.portfolios.map(p => (
                  <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={p.imageUrl} alt={p.caption || 'Portfolio'} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Book an appointment</h2>
            {session ? (
              <BookingForm
                services={provider.services}
                providerId={provider.id}
                clientId={session.id}
              />
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-4">Sign in to book an appointment</p>
                <a href="/login" className="btn-primary w-full">Sign in to book</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
