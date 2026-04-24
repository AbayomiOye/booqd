// app/search/page.js
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/Navbar'

async function search({ q, category, location }) {
  try {
    return await prisma.provider.findMany({
      where: {
        verified: true,
        ...(category ? { category } : {}),
        ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
        ...(q ? {
          OR: [
            { businessName: { contains: q, mode: 'insensitive' } },
            { description:  { contains: q, mode: 'insensitive' } },
            { services: { some: { serviceName: { contains: q, mode: 'insensitive' } } } },
          ],
        } : {}),
      },
      include: {
        services: { take: 3, orderBy: { price: 'asc' } },
        portfolios: { take: 1 },
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch { return [] }
}

const CATEGORIES = ['All','Makeup & Hair','Nails','Skincare','Lashes','Braiding','Spa']

export default async function SearchPage({ searchParams }) {
  const q = searchParams?.q || ''
  const category = searchParams?.category === 'All' ? '' : (searchParams?.category || '')
  const location = searchParams?.location || ''
  const providers = await search({ q, category, location })

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Search header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <form className="flex flex-col sm:flex-row gap-3">
            <input name="q" defaultValue={q} placeholder="Search services, e.g. braiding, makeup..."
              className="input flex-1" />
            <input name="location" defaultValue={location} placeholder="City or area"
              className="input sm:w-48" />
            <button type="submit" className="btn-primary px-6">Search</button>
          </form>
          {/* Category pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <Link key={cat}
                href={`/search?q=${q}&location=${location}&category=${cat === 'All' ? '' : cat}`}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                  ${(cat === 'All' && !category) || cat === category
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-sm text-gray-500 mb-5">
          {providers.length} provider{providers.length !== 1 ? 's' : ''} found
          {category ? ` in ${category}` : ''}
          {location ? ` near ${location}` : ''}
        </p>

        {providers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-medium text-gray-600">No providers found</p>
            <p className="text-sm mt-1">Try a different search term or category</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map(provider => {
              const cover = provider.portfolios[0]?.imageUrl ||
                'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600'
              const minPrice = provider.services.length
                ? Math.min(...provider.services.map(s => s.price)) : null
              return (
                <Link key={provider.id} href={`/providers/${provider.id}`}
                  className="card group hover:shadow-md transition-shadow overflow-hidden block">
                  <div className="h-44 overflow-hidden bg-gray-100 relative">
                    <img src={cover} alt={provider.businessName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <span className="badge-purple">{provider.category}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                      {provider.businessName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">📍 {provider.location}</p>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{provider.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {provider.services.slice(0, 2).map(s => (
                          <span key={s.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {s.serviceName}
                          </span>
                        ))}
                      </div>
                      {minPrice && (
                        <span className="text-sm font-semibold text-brand-700">
                          from ₦{minPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
