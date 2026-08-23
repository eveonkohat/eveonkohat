import type { ReactNode } from "react"

export function PageBanner({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div
      className="mb-6 flex flex-col gap-4 rounded-2xl p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between"
      style={{
        backgroundImage:
          "linear-gradient(135deg, oklch(0.3 0.12 264), oklch(0.5 0.19 264))",
      }}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-primary-foreground/70 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-primary-foreground/80">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  )
}
