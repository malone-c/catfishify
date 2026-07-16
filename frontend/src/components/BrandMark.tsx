interface BrandMarkProps {
  className?: string
  decorative?: boolean
}

export default function BrandMark({ className, decorative = true }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : 'Catfishify'}
    >
      <path
        d="M12.6 20.2 15.4 9l8.4 6.2L32.7 9l2.7 11.2c3.3 2.7 5.1 6.4 5.1 10.7 0 8-6.7 12.1-16.4 12.1S7.5 38.9 7.5 30.9c0-4.2 1.8-8 5.1-10.7Z"
        fill="currentColor"
      />
      <path d="M17.2 27.2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2ZM30.8 27.2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Z" fill="var(--canvas)" />
      <path d="m22 30.4 2 1.6 2-1.6" stroke="var(--canvas)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 31.5h13M4 36h14.5M43 31.5H30M44 36H29.5" stroke="var(--sea)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
