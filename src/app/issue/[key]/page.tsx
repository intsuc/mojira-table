import { Issue } from "@/components/issue"
import type { Metadata } from "next"
import * as v from "valibot"
import { codeToHtml, type BundledLanguage } from "shiki"
import { jqlSearchPostSingle, ParamsSchema, type Props } from "./common"

export const revalidate = 900

export const dynamic = "force-static"

export async function generateMetadata(
  { params }: Props,
): Promise<Metadata> {
  const result = v.safeParse(ParamsSchema, await params)
  if (result.success) {
    const { key } = result.output
    const issue = await jqlSearchPostSingle(key)
    return {
      title: issue.fields.summary,
    }
  } else {
    return {
      title: "Issue not found",
    }
  }
}

export default async function Page({
  params,
}: Props) {
  "use cache"

  const result = v.safeParse(ParamsSchema, await params)
  if (result.success) {
    const { key } = result.output
    try {
      const issue = await jqlSearchPostSingle(key)

      return (
        <div className="p-8">
          <Issue issue={issue} CodeBlockComponent={CodeBlock} />
        </div>
      )
    } catch (_) {
      return (
        <div className="p-8 h-full grid place-items-center">
          <div className="text-2xl font-bold">Issue not found</div>
        </div>
      )
    }
  } else {
    return (
      <div className="p-8 h-full grid place-items-center">
        <div className="text-2xl font-bold">Invalid issue key</div>
      </div>
    )
  }
}

async function CodeBlock({
  text,
  lang,
}: {
  text: string
  lang: BundledLanguage,
}) {
  const out = await codeToHtml(text, {
    lang,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  })

  return <div dangerouslySetInnerHTML={{ __html: out }} />
}
