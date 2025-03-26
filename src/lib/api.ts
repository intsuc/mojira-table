export type JqlSearchRequest = {
  advanced: boolean,
  search: "",
  project: "MC" | "MCPE" | "REALMS" | "MCL" | "BDS" | "WEB",
  isForge: boolean,
  sortField: "created" | "updated" | "priority" | "status",
  sortAsc: boolean,
  filter: "open",
  startAt: number,
  maxResults: number,
  workspaceId: "",
}

export type JqlSearchResponse = {
  expand: string,
  startAt: number,
  maxResults: number,
  total: number,
  issues: {
    expand: string,
    id: string,
    self: string,
    key: string,
    renderedFields: Record<string, string | null>,
    fields: {
      summary: string,
      watches: {
        self: string,
        watchCount: number,
        isWatching: boolean,
      },
      issuetype: {
        self: string,
        id: string,
        description: string,
        iconUrl: string,
        name: string,
        subtask: boolean,
        avatarId: number,
        hierarchyLevel: number,
      },
      customfield_10070: 0,
      created: string,
      customfield_10061: null,
      customfield_10050: null,
      customfield_10051: null,
      description: {
        type: string,
        version: number,
        content: unknown[],
      },
      customfield_10054: {
        self: string
        value: string,
        id: string,
      },
      fixVersions: unknown[],
      customfield_10055: {
        self: string,
        value: string,
        id: string,
      }[],
      resolution: null,
      customfield_10047: null,
      labels: unknown[],
      customfield_10048: null,
      customfield_10049: null,
      versions: {
        self: string,
        id: string,
        name: string,
        archived: boolean,
        released: boolean,
        releaseDate: string,
      }[],
      resolutiondate: null,
      issuelinks: unknown[],
      updated: string,
      status: {
        self: string,
        description: string,
        iconUrl: string,
        name: string,
        id: string,
        statusCategory: {
          self: string,
          id: number,
          key: string,
          colorName: string,
          name: string,
        },
      },
    },
  }[],
  names: Record<string, string>,
}

const JqlSearchPost = "https://bugs.mojang.com/api/jql-search-post"

export async function jqlSearchPost(request: JqlSearchRequest): Promise<JqlSearchResponse> {
  const response = await fetch(JqlSearchPost, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })
  return response.json()
}
