"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type View = "signin" | "signup" | "forgot"

type AuthModalLauncherProps = {
  label?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  className?: string
  onOpen?: () => void
}

export function AuthModalLauncher({
  label = "Sign in",
  variant = "ghost",
  size = "sm",
  className,
  onOpen,
}: AuthModalLauncherProps) {
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<View>("signin")

  const openWith = (next: View) => {
    setView(next)
    setOpen(true)
    onOpen?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => openWith("signin")}
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {view === "signin" && (
          <SigninView
            onGoSignup={() => setView("signup")}
            onGoForgot={() => setView("forgot")}
          />
        )}
        {view === "signup" && (
          <SignupView onGoSignin={() => setView("signin")} />
        )}
        {view === "forgot" && (
          <ForgotView onGoSignin={() => setView("signin")} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({ id, label, type = "text", placeholder }: { id: string; label: string; type?: string; placeholder?: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} required />
    </div>
  )
}

function AuthActions({
  primaryLabel,
  onSubmit,
  secondary,
  muted,
}: {
  primaryLabel: string
  onSubmit?: () => void
  secondary?: React.ReactNode
  muted?: React.ReactNode
}) {
  return (
    <div className="grid gap-3">
      <Button onClick={onSubmit} className="w-full">
        {primaryLabel}
      </Button>
      {secondary}
      {muted}
    </div>
  )
}

function SigninView({ onGoSignup, onGoForgot }: { onGoSignup: () => void; onGoForgot: () => void }) {
  return (
    <div className="grid gap-6">
      <DialogHeader>
        <DialogTitle>Welcome back</DialogTitle>
        <DialogDescription>Sign in to your account</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <Field id="email" label="Email" type="email" placeholder="you@example.com" />
        <Field id="password" label="Password" type="password" placeholder="••••••••" />
        <div className="flex items-center justify-between text-sm">
          <button type="button" className="text-primary hover:underline" onClick={onGoForgot}>
            Forgot password?
          </button>
          <div className="flex items-center gap-2 text-muted-foreground">
            <input id="remember" type="checkbox" className="h-4 w-4 rounded border-input" />
            <label htmlFor="remember">Remember me</label>
          </div>
        </div>
      </div>
      <AuthActions
        primaryLabel="Sign in"
        secondary={
          <Button variant="outline" className="w-full" onClick={onGoSignup}>
            Create an account
          </Button>
        }
        muted={<p className="text-xs text-muted-foreground text-center">Demo only — no real auth yet</p>}
      />
    </div>
  )
}

function SignupView({ onGoSignin }: { onGoSignin: () => void }) {
  return (
    <div className="grid gap-6">
      <DialogHeader>
        <DialogTitle>Create your account</DialogTitle>
        <DialogDescription>Sign up to get started</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <Field id="name" label="Name" placeholder="Ada Lovelace" />
        <Field id="email" label="Email" type="email" placeholder="you@example.com" />
        <Field id="password" label="Password" type="password" placeholder="••••••••" />
        <Field id="confirm" label="Confirm password" type="password" placeholder="••••••••" />
      </div>
      <AuthActions
        primaryLabel="Create account"
        secondary={
          <Button variant="outline" className="w-full" onClick={onGoSignin}>
            Back to sign in
          </Button>
        }
        muted={<p className="text-xs text-muted-foreground text-center">Demo only — no real auth yet</p>}
      />
    </div>
  )
}

function ForgotView({ onGoSignin }: { onGoSignin: () => void }) {
  return (
    <div className="grid gap-6">
      <DialogHeader>
        <DialogTitle>Reset your password</DialogTitle>
        <DialogDescription>We’ll send a reset link to your email</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <Field id="email" label="Email" type="email" placeholder="you@example.com" />
      </div>
      <AuthActions
        primaryLabel="Send reset link"
        secondary={
          <Button variant="outline" className="w-full" onClick={onGoSignin}>
            Back to sign in
          </Button>
        }
        muted={<p className="text-xs text-muted-foreground text-center">Demo only — no real auth yet</p>}
      />
    </div>
  )
}

export function AuthPreviewButtons() {
  const [key, setKey] = React.useState(0)
  // Simple way to reset internal state across multiple launchers in a demo row
  const bump = () => setKey((k) => k + 1)
  return (
    <div className="flex flex-wrap gap-2">
      <AuthModalLauncher key={`signin-${key}`} label="Sign in" variant="ghost" />
      <AuthModalLauncher key={`signup-${key}`} label="Sign up" variant="secondary" onOpen={bump} />
      <AuthModalLauncher key={`forgot-${key}`} label="Forgot password" variant="outline" onOpen={bump} />
    </div>
  )
}

