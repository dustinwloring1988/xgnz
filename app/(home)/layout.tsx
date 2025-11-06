import type React from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PageTransition } from "@/components/page-transition"
import { Suspense } from "react"

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      <Suspense>
        <PageTransition>
          <div className="flex-1">{children}</div>
        </PageTransition>
      </Suspense>
      <SiteFooter />
    </>
  )
}
