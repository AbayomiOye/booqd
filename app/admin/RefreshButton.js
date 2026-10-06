'use client'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
export default function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return <button className="btn-outline" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? 'Refreshing…' : 'Refresh activity'}</button>
}
