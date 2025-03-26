"use client"

import { useEffect, useState } from "react"
import { jqlSearchPost, type JqlSearchResponse } from "@/lib/api"

export default function Page() {
  const [response, setResponse] = useState<JqlSearchResponse | undefined>(undefined)

  useEffect(() => {
    const fetchData = async () => {
      const response = await jqlSearchPost({
        advanced: false,
        search: "",
        project: "MC",
        isForge: false,
        sortField: "created",
        sortAsc: false,
        filter: "open",
        startAt: 0,
        maxResults: 5,
        workspaceId: "",
      })
      setResponse(response)
    }
    fetchData()
  }, [])

  return (
    <div>
      <pre>
        <code>
          {JSON.stringify(response, null, 2)}
        </code>
      </pre>
    </div>
  )
}
