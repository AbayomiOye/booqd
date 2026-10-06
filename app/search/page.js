import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/Navbar'
import Icon from '@/components/Icon'
const CATEGORIES = ['All', 'Makeup & Hair', 'Nails', 'Skincare', 'Lashes', 'Braiding', 'Spa']
export default async function SearchPage({ searchParams }) {
  const params = await searchParams
  const string = key => typeof params?.[key] === 'string' ? params[key].trim() : ''
  const q = string('q'), location = string('location')
  const category = CATEGORIES.includes(string('category')) && string('category') !== 'All' ? string('category') : ''
  const budget = Number(string('budget')) > 0 ? Number(string('budget')) : null
  const sort = string('sort') === 'price' ? 'price' : 'newest'
  let providers = [], failed = false
  try {
    providers = await prisma.provider.findMany({ where: {
      verified: true,
      ...(category ? { category } : {}),
      ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
      ...(budget ? { services: { some: { price: { lte: budget } } } } : {}),
      ...(q ? { OR: [{ businessName: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { services: { some: { serviceName: { contains: q, mode: 'insensitive' } } } }] } : {}),
    }, include: { services: { take: 3, orderBy: { price: 'asc' } }, portfolios: { take: 1 } }, orderBy: { createdAt: 'desc' } })
    if (sort === 'price') providers.sort((a, b) => (a.services[0]?.price ?? Infinity) - (b.services[0]?.price ?? Infinity))
  } catch { failed = true }
  function categoryHref(value) {
    const query = new URLSearchParams({ q, location, sort })
    if (budget) query.set('budget', String(budget))
    if (value !== 'All') query.set('category', value)
    return `/search?${query}`
  }
  return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="mb-8 max-w-2xl"><p className="eyebrow">Your next little reset</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Find your beauty professional.</h1><p className="mt-3 leading-relaxed text-gray-600">Discover services near you, compare prices, and choose a time that fits your day.</p></header>
    <section className="card p-5 sm:p-6" aria-label="Find and filter providers"><form action="/search" className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="lg:col-span-2"><label htmlFor="search-query" className="label">Service or business</label><input id="search-query" name="q" defaultValue={q} placeholder="Braiding, makeup, a salon…" className="input" /></div>
      <div><label htmlFor="search-location" className="label">City or area</label><input id="search-location" name="location" defaultValue={location} placeholder="e.g. Lekki, Lagos" className="input" /></div>
      <div><label htmlFor="search-budget" className="label">Budget</label><select id="search-budget" name="budget" defaultValue={budget || ''} className="input"><option value="">Any price</option>{[5000, 10000, 20000, 50000].map(n => <option key={n} value={n}>Up to ₦{n.toLocaleString()}</option>)}</select></div>
      <input type="hidden" name="category" value={category} /><input type="hidden" name="sort" value={sort} /><button className="btn-primary" type="submit"><Icon name="search" />Search</button>
    </form><nav className="mt-5 flex flex-wrap gap-2" aria-label="Service categories">{CATEGORIES.map(cat => { const active = (cat === 'All' && !category) || cat === category; return <Link key={cat} href={categoryHref(cat)} aria-current={active ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors ${active ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-brand-400'}`}>{cat}</Link> })}</nav></section>
    <div className="my-6 flex flex-wrap items-center justify-between gap-4"><p role="status" className="text-sm text-gray-600">{providers.length} provider{providers.length !== 1 ? 's' : ''}{location && ` near ${location}`}{category && ` · ${category}`}</p><div className="flex items-center gap-4">{(q || location || category || budget) && <Link href="/search" className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700">Clear filters</Link>}<Link href={`/search?${new URLSearchParams({ q, location, category, ...(budget ? { budget: String(budget) } : {}), sort: sort === 'price' ? 'newest' : 'price' })}`} className="btn-outline text-sm">{sort === 'price' ? 'Sort: lowest price' : 'Sort: newest'}</Link></div></div>
    {failed ? <div className="card p-8 text-center" role="alert"><h2 className="text-xl font-semibold">We couldn’t load providers.</h2><p className="mt-2 text-gray-600">Please try again in a moment.</p><Link href={categoryHref(category || 'All')} className="btn-primary mt-5">Try again</Link></div> : !providers.length ? <div className="card p-10 text-center"><Icon name="search" className="mx-auto h-10 w-10 text-brand-400" /><h2 className="mt-4 text-xl font-semibold">No matches just yet</h2><p className="mx-auto mt-2 max-w-md text-gray-600">Try a nearby area, a broader service, or a higher budget.</p><Link href="/search" className="btn-outline mt-5">Browse all providers</Link></div> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{providers.map(p => <Link key={p.id} href={`/providers/${p.id}`} className="card group block overflow-hidden transition-shadow hover:shadow-md"><div className="flex h-48 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50">{p.portfolios[0] ? <img src={p.portfolios[0].imageUrl} alt={`${p.businessName} portfolio`} loading="lazy" className="h-full w-full object-cover" /> : <span className="text-4xl font-semibold text-brand-300" aria-hidden="true">{p.businessName.split(' ').slice(0, 2).map(w => w[0]).join('')}</span>}</div><div className="p-5"><div className="mb-3 flex flex-wrap gap-2"><span className="badge-purple">{p.category}</span><span className="badge-green">Verified</span></div><h2 className="text-lg font-semibold group-hover:text-brand-700">{p.businessName}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600"><Icon name="pin" className="h-4 w-4" />{p.location}</p><p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-600">{p.description || `Explore ${p.category.toLowerCase()} services and appointment times.`}</p><div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-100 pt-4"><span className="text-sm font-semibold">{p.services.length ? `From ₦${p.services[0].price.toLocaleString()}` : 'Services coming soon'}</span><span className="flex items-center gap-1 text-sm font-medium text-brand-700">View profile<Icon name="arrow" className="h-4 w-4" /></span></div></div></Link>)}</div>}
  </main></div>
}
