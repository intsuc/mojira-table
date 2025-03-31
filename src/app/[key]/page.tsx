"use cache"

import { Issue } from "@/components/issue"
import { jqlSearchPostUrl, type JqlSearchRequest, type JqlSearchResponse } from "@/lib/api"

async function jqlSearchPostSingle(key: string): Promise<JqlSearchResponse> {
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
}: {
  params: Promise<{ key: string }>,
}) {
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
