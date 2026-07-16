import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'

export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <main className="page-state page-state--loading" aria-busy="true">
      <BrandMark className="page-state__mark" />
      <div className="page-state__pulse" aria-hidden="true" />
      <p role="status">{label}…</p>
    </main>
  )
}

interface PageErrorProps {
  title: string
  message: string
  action?: ReactNode
}

export function PageError({ title, message, action }: PageErrorProps) {
  return (
    <main className="page-state">
      <span className="page-state__eyebrow">Something went sideways</span>
      <h1>{title}</h1>
      <p role="alert">{message}</p>
      <div className="page-state__actions">
        {action}
        <Link className="button button--secondary" to="/">Return home</Link>
      </div>
    </main>
  )
}
