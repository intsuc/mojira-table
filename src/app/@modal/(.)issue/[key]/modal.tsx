"use client"

import { useLayoutEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import Link from "next/link"
import { Issue } from "@/components/issue"
import type { BundledLanguage } from "shiki"
import { useStore } from "@tanstack/react-store"
import { store } from "@/lib/store"
import { useIsMobile } from "@/hooks/use-mobile"

export function Modal() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const activeIssue = useStore(store, (state) => state.activeIssue)!

  return isMobile ? (
    <Drawer
      open
      onOpenChange={(open) => { if (!open) { router.back() } }}
    >
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>
            <div className="h-full flex flex-col">
              <Link
                href={`/issue/${activeIssue.key}`}
                target="_blank"
                className="text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {activeIssue.key}
              </Link>
              <div className="text-2xl">{activeIssue.fields.summary}</div>
            </div>
          </DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <div className="px-6 h-full overflow-y-auto">
          <Issue issue={activeIssue} hideSummary CodeBlockComponent={CodeBlock} />
        </div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog
      open
      onOpenChange={(open) => { if (!open) { router.back() } }}
    >
      <DialogContent className="w-4xl grid-rows-[auto_1fr]">
        <DialogHeader>
          <DialogTitle>
            <div className="h-full flex flex-col">
              <Link
                href={`/issue/${activeIssue.key}`}
                target="_blank"
                className="text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {activeIssue.key}
              </Link>
              <div className="text-2xl font-bold">{activeIssue.fields.summary}</div>
            </div>
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="h-full overflow-y-auto">
          <Issue issue={activeIssue} hideSummary CodeBlockComponent={CodeBlock} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CodeBlock({
  text,
  lang,
}: {
  text: string,
  lang: BundledLanguage,
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const highlighter = useStore(store, (state) => state.highlighter)

  useLayoutEffect(() => {
    void (async () => {
      const out = (await highlighter).codeToHtml(text, {
        lang,
        themes: {
          dark: "github-dark",
          light: "github-light",
        },
      })
      if (containerRef.current !== null) {
        containerRef.current.innerHTML = out
      }
    })()
  }, [highlighter, lang, text])

  return <div ref={containerRef}></div>
}
