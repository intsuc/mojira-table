import { jqlSearchPostUrl, type JqlSearchRequest, type JqlSearchResponse, type projects } from "@/lib/api"
import * as v from "valibot"

export type Key = `${typeof projects[number]["id"]}-${number}`

function isValidKey(key: unknown): key is Key {
  return typeof key === "string" && /^(?:MC|MCPE|REALMS|MCL|BDS|WEB)-\d+$/.test(key)
}

export const ParamsSchema = v.object({
  key: v.custom<Key>(isValidKey),
})

export type Props = {
  params: Promise<{ key: string }>,
}

export async function jqlSearchPostSingle(key: Key): Promise<JqlSearchResponse["issues"][number]> {
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
    const result = await response.json() as JqlSearchResponse
    return result.issues[0]!
  } else {
    throw new Error(response.statusText)
  }
}
