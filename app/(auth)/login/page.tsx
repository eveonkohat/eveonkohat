import type { Metadata } from "next"
import { Zap } from "lucide-react"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Sign in",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect: redirectTo } = await searchParams

  return (
    <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-xl md:grid-cols-2">
      {/* Visual panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground md:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(0.5 0.19 264 / 0.5), transparent 45%), radial-gradient(circle at 85% 75%, oklch(0.6 0.2 210 / 0.35), transparent 50%)",
          }}
        />
        <svg
          aria-hidden
          viewBox="0 0 400 400"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]"
        >
          <circle cx="120" cy="300" r="55" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="300" cy="300" r="55" fill="none" stroke="currentColor" strokeWidth="3" />
          <path
            d="M120 300 L190 220 L250 220 L300 300 M190 220 L230 160 L280 160 M120 300 L60 300"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M40 120 L120 120 M40 160 L160 160 M40 200 L100 200"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>

        <div className="relative z-10 flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" fill="currentColor" />
          </span>
          EveonKohat
        </div>

        <div className="relative z-10 space-y-2">
          <p className="text-2xl leading-snug font-semibold">
            Run your entire showroom from one dashboard.
          </p>
          <p className="text-sm text-sidebar-foreground/70">
            Stock, purchases, sales, installments, and accounts — all in sync,
            all in real time.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center gap-6 p-8 sm:p-10">
        <span className="inline-flex w-fit items-center rounded-full bg-primary px-4 py-1.5 text-xs font-bold tracking-wide text-primary-foreground uppercase">
          EveonKohat Bike SaaS
        </span>

        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">
            Manage your premium bike showroom inventory and sales with ease.
          </p>
        </div>

        <LoginForm redirectTo={redirectTo} />

        <p className="border-t pt-5 text-center text-xs text-muted-foreground">
          Securely managed by EveonKohat Platform
        </p>
      </div>
    </div>
  )
}
