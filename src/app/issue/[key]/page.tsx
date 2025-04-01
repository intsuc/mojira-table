import { Issue } from "@/components/issue"
import { jqlSearchPostUrl, type JqlSearchRequest, type JqlSearchResponse, type projects } from "@/lib/api"
import type { Metadata } from "next"
import * as v from "valibot"
import { codeToHtml, type BundledLanguage } from "shiki"

export const revalidate = 900

export const dynamic = "force-static"

type Key = `${typeof projects[number]["id"]}-${number}`

function isValidKey(key: unknown): key is Key {
  return typeof key === "string" && /^(?:MC|MCPE|REALMS|MCL|BDS|WEB)-\d+$/.test(key)
}

const ParamsSchema = v.object({
  key: v.custom<Key>(isValidKey),
})

type Props = {
  params: Promise<v.InferInput<typeof ParamsSchema>>,
}

export async function generateMetadata(
  { params }: Props,
): Promise<Metadata> {
  const { key } = await params

  return {
    title: key,
  }
}

async function jqlSearchPostSingle(key: Key): Promise<JqlSearchResponse> {
  "use cache"

  const project = key.split("-")[0]
  const response = await fetch(jqlSearchPostUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: project as JqlSearchRequest["project"],
      advanced: true,
      search: `key = ${key}`,
      startAt: 0,
      maxResults: 1,
    }),
  })
  if (response.ok) {
    return response.json() as Promise<JqlSearchResponse>
  } else {
    throw new Error(response.statusText)
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
      const { issues } = await jqlSearchPostSingle(key)
      const issue = issues[0]

      return (
        <div className="p-8">
          {issue !== undefined ? (
            <Issue issue={issue} CodeBlockComponent={CodeBlock} />
          ) : null}
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
