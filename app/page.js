// app/page.js
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/Navbar'
import Icon from '@/components/Icon'

const CATEGORIES = [
  { name: 'Makeup & Hair', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { name: 'Nails',         color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Skincare',      color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Lashes',        color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'Braiding',      color: 'bg-green-50 text-green-700 border-green-200' },
  { name: 'Spa',           color: 'bg-teal-50 text-teal-700 border-teal-200' },
]

async function getFeaturedProviders() {
  try {
    return await prisma.provider.findMany({
      where: { verified: true },
      include: {
        user: { select: { name: true } },
        services: { take: 2, orderBy: { price: 'asc' } },
        portfolios: { take: 1 },
        _count: { select: { appointments: true } },
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return []
  }
}

function ProviderCard({ provider }) {
  const coverImage = provider.portfolios[0]?.imageUrl
  const minPrice = provider.services.length
    ? Math.min(...provider.services.map(s => s.price))
    : null

  return (
    <Link href={`/providers/${provider.id}`} className="card group hover:shadow-md transition-shadow duration-200 overflow-hidden block">
      <div className="h-44 overflow-hidden bg-gray-100 relative">
        {coverImage ? <img src={coverImage} alt={`${provider.businessName} portfolio`} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-brand-50 text-4xl font-semibold text-brand-300" aria-hidden="true">{provider.businessName.split(' ').slice(0, 2).map(w => w[0]).join('')}</div>}
        <div className="absolute top-3 left-3">
          <span className="badge-purple">{provider.category}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
          {provider.businessName}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
          <Icon name="pin" className="h-4 w-4" /> {provider.location}
        </p>
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{provider.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {provider.services.slice(0, 2).map(s => (
              <span key={s.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {s.serviceName}
              </span>
            ))}
          </div>
          {minPrice !== null && (
            <span className="text-sm font-semibold text-brand-700">
              from ₦{minPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default async function HomePage() {
  const providers = await getFeaturedProviders()

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/90 text-sm mb-6">
            Nigeria's beauty booking platform
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Connect.<br className="sm:hidden" /> Book. <span className="text-gold-400">Glow.</span>
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Find trusted makeup artists, nail technicians, hairstylists, and skincare specialists near you. Compare services, request a time, and track your booking in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/search" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 text-base px-8 py-3">
              Find a Provider
            </Link>
            <Link href="/register?role=provider" className="btn-outline border-white/40 text-white hover:bg-white/10 text-base px-8 py-3">
              Join as a Provider
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-3 divide-x divide-gray-100 text-center">
          {[['Compare', 'Services & prices'],['Choose', 'Available times'],['Track', 'Your appointments']].map(([stat, label]) => (
            <div key={label} className="px-4">
              <div className="text-xl font-bold text-brand-700">{stat}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORIES.map(cat => (
            <Link key={cat.name} href={`/search?category=${encodeURIComponent(cat.name)}`}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${cat.color} hover:border-brand-400 transition-colors`}>

              <span className="text-sm font-medium text-center leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured providers */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured providers</h2>
          <Link href="/search" className="text-brand-600 text-sm font-medium hover:underline">View all →</Link>
        </div>
        {providers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map(p => <ProviderCard key={p.id} provider={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Icon name="search" className="mx-auto mb-3 h-10 w-10 text-brand-400" />
            <p>No providers yet — be the first to join!</p>
            <Link href="/register?role=provider" className="btn-primary mt-4 inline-flex">Join as Provider</Link>
          </div>
        )}
      </section>

      {/* CTA Footer */}
      <section className="bg-brand-900 text-white py-14">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-3">Are you a beauty professional?</h2>
          <p className="text-white/70 mb-8">Create a profile, showcase your services, and manage your booking requests in one place.</p>
          <Link href="/register?role=provider" className="btn-primary bg-gold-400 text-gray-900 hover:bg-gold-500 text-base px-8 py-3">
            Create your free profile
          </Link>
        </div>
      </section>
    </div>
  )
}
