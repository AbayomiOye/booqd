import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import Icon from '@/components/Icon'
import { DEFAULT_HOURS, validateHours } from '@/lib/availability.cjs'
import BookingForm from './BookingForm'

export default async function ProviderPage({ params }) {
  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id < 1) notFound()
  const provider = await prisma.provider.findUnique({ where: { id }, include: { services: { orderBy: { price: 'asc' } }, portfolios: true } })
  if (!provider) notFound()
  const session = await getSession()
  const hours = validateHours(provider.openingHours) ? provider.openingHours : DEFAULT_HOURS
  return <div className="min-h-screen"><Navbar />
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/search" className="mb-6 inline-flex min-h-11 items-center text-sm font-medium text-brand-700">← Back to providers</Link>
      <header className="card overflow-hidden mb-8">
        <div className="relative h-36 bg-gradient-to-r from-brand-100 via-brand-50 to-white sm:h-52">
          {provider.portfolios[0] && <img src={provider.portfolios[0].imageUrl} alt={`${provider.businessName} portfolio`} className="h-full w-full object-cover" />}
          {!provider.portfolios[0] && <div className="flex h-full items-center justify-center text-4xl font-semibold tracking-widest text-brand-300" aria-hidden="true">{provider.businessName.split(' ').slice(0, 2).map(w => w[0]).join('')}</div>}
        </div>
        <div className="p-6 sm:p-8"><div className="flex flex-wrap items-center gap-3"><span className="badge-purple">{provider.category}</span>{provider.verified && <span className="badge-green"><Icon name="shield" className="mr-1 h-4 w-4" />Verified provider</span>}</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{provider.businessName}</h1>
          <p className="mt-3 flex items-center gap-2 text-gray-600"><Icon name="pin" />{provider.location || 'Location available from provider'}</p>
          <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">{provider.description || `Explore ${provider.businessName}’s services and choose a time that works for you.`}</p>
          <div className="mt-5 flex flex-wrap gap-3"><a href="#booking" className="btn-primary">Choose an appointment<Icon name="arrow" /></a>{provider.phone && <a href={`tel:${provider.phone.replace(/[^+0-9]/g, '')}`} className="btn-outline">Call provider</a>}</div>
        </div>
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6 sm:p-8" aria-labelledby="services-heading"><div className="mb-5"><p className="eyebrow">Find your service</p><h2 id="services-heading" className="mt-2 text-xl font-bold">Services & pricing</h2></div>
            {!provider.services.length && <p className="text-gray-600">No bookable services yet.</p>}
            <div className="divide-y divide-gray-100">{provider.services.map(s => <div key={s.id} className="flex flex-wrap items-start justify-between gap-4 py-5"><div className="min-w-0 flex-1"><h3 className="font-semibold">{s.serviceName}</h3>{s.description && <p className="mt-1 text-sm leading-relaxed text-gray-600">{s.description}</p>}<p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600"><Icon name="clock" className="h-4 w-4" />{s.durationMin} minutes</p></div><p className="font-semibold text-brand-700">₦{s.price.toLocaleString()}</p></div>)}</div>
          </section>
          <section className="card p-6 sm:p-8"><h2 className="text-xl font-bold">Their work</h2>{provider.portfolios.length ? <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">{provider.portfolios.map(p => <figure key={p.id}><img src={p.imageUrl} alt={p.caption || `${provider.businessName} portfolio work`} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />{p.caption && <figcaption className="mt-2 text-sm text-gray-600">{p.caption}</figcaption>}</figure>)}</div> : <p className="mt-3 text-sm text-gray-600">This provider hasn’t shared portfolio photos yet. You can call to ask about their recent work.</p>}</section>
          <section className="card p-6 sm:p-8"><h2 className="text-xl font-bold">Before you book</h2><div className="mt-5 grid gap-6 sm:grid-cols-2"><div><h3 className="font-semibold">Working hours</h3><p className="mt-1 text-xs text-gray-600">Nigeria time (WAT)</p><dl className="mt-3 space-y-2 text-sm">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => <div className="flex justify-between gap-4" key={day}><dt className="text-gray-600">{day}</dt><dd>{hours[i].closed ? 'Closed' : `${hours[i].open}–${hours[i].close}`}</dd></div>)}</dl></div><div className="space-y-4 text-sm leading-relaxed text-gray-600"><div><h3 className="font-semibold text-gray-900">Confirmation & payment</h3><p className="mt-1">Your provider confirms each request. Agree payment arrangements directly with them.</p></div><div><h3 className="font-semibold text-gray-900">Provider verification</h3><p className="mt-1">{provider.verified ? 'This provider has been marked as verified by Booq’d’s admin team.' : 'This provider has not yet been marked as verified by Booq’d’s admin team.'} This is not a guarantee of service quality.</p></div><div><h3 className="font-semibold text-gray-900">Need to cancel?</h3><p className="mt-1">You can cancel an active booking from My bookings. Contact your provider about any payment arrangements.</p></div></div></div></section>
        </div>
        <aside id="booking" className="card scroll-mt-28 p-6 lg:sticky lg:top-28"><p className="eyebrow">Make time for you</p><h2 className="mb-5 mt-2 text-xl font-bold">Book an appointment</h2>{session ? <BookingForm services={provider.services} providerId={provider.id} businessName={provider.businessName} location={provider.location} /> : <div><p className="mb-4 text-sm text-gray-600">Sign in to choose an available time and keep track of your appointment.</p><Link href="/login" className="btn-primary w-full">Sign in to book</Link></div>}</aside>
      </div>
    </main>
  </div>
}
