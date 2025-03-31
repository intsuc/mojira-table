"use cache"

import { Issue } from "@/components/issue"
import { jqlSearchPost, type JqlSearchRequest } from "@/lib/api"

export default async function Page({
  params,
}: {
  params: Promise<{ key: string }>
}) {
  // TODO: validation

  const { key } = await params
  const project = key.split("-")[0]
  const { issues } = await jqlSearchPost({
    project: project as JqlSearchRequest["project"],
    advanced: true,
    search: `key = ${key}`,
    startAt: 0,
    maxResults: 1,
  })
  const issue = issues[0]

  return (
    <div className="p-8">
      {issue !== undefined ? (
        <Issue issue={issue} />
      ) : null}
    </div>
  )
}
