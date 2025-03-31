import { Issue } from "@/components/issue"
import { jqlSearchPostUrl, type JqlSearchRequest, type JqlSearchResponse } from "@/lib/api"
import type { Metadata } from "next"

export const revalidate = 60

export const dynamicParams = true

export async function generateStaticParams() {
  return []
}

async function jqlSearchPostSingle(key: string): Promise<JqlSearchResponse> {
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

type Props = {
  params: Promise<{ key: string }>,
}

export async function generateMetadata(
  { params }: Props,
): Promise<Metadata> {
  const { key } = await params

  return {
    title: key,
  }
}

export default async function Page({
  params,
}: Props) {
  "use cache"

  // TODO: validation

  const { key } = await params
  const { issues } = await jqlSearchPostSingle(key)
  const issue = issues[0]

  return (
    <div className="p-8">
      {issue !== undefined ? (
        <Issue issue={issue} />
      ) : null}
    </div>
  )
}
