export const projects = [
  { id: "MC", label: "Minecraft: Java Edition" },
  { id: "MCPE", label: "Minecraft: Bedrock Edition" },
  { id: "REALMS", label: "Minecraft Realms" },
  { id: "MCL", label: "Minecraft Launcher" },
  { id: "BDS", label: "Bedrock Dedicated Server" },
  { id: "WEB", label: "Mojang Web Services" },
] as const

export type JqlSearchRequest = {
  project: typeof projects[number]["id"],
  filter: "all" | "open" | "done",
  sortField: "created" | "updated" | "priority" | "status",
  sortAsc: boolean,
  advanced: boolean,
  search: string,
  startAt: number,
  maxResults: number,
  isForge: boolean,
  workspaceId: "",
}

export type Content =
  | { type: "bulletList", content?: Content[] }
  | { type: "codeBlock", content?: Content[] }
  | { type: "doc", version: number, content?: Content[] }
  | { type: "emoji", attrs: { shortName: string, id: string, text: string } }
  | { type: "hardBreak" }
  | { type: "heading", attrs: { level: 1 | 2 | 3 | 4 | 5 | 6 }, content?: Content[] }
  | { type: "inlineCard", attrs: { url: string } }
  | { type: "listItem", content?: Content[] }
  | { type: "media", attrs: { type: "external", url: string, height: number, width: number } }
  | { type: "mediaSingle", attrs: { layout: "center" }, content?: Content[] }
  | { type: "mention", attrs: { id: string, text: string, accessLevel: string } }
  | { type: "orderedList", attrs: { order: 1 }, content?: Content[] }
  | { type: "panel", attrs: { panelType: "note" | "info" }, content?: Content[] }
  | { type: "paragraph", content?: Content[] }
  | { type: "text", text: string }

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
      customfield_10070: number | null,
      created: string,
      customfield_10061: null,
      customfield_10050: string | null,
      customfield_10051: {
        self: string
        value: string,
        id: string,
      } | null,
      description: Content | null,
      customfield_10054: {
        self: string
        value: string,
        id: string,
      } | null,
      fixVersions: {
        self: string,
        id: string,
        description: string,
        name: string,
        archived: boolean,
        released: boolean,
        releaseDate: string,
      }[],
      customfield_10055: {
        self: string,
        value: string,
        id: string,
      }[] | null,
      resolution: {
        self: string,
        id: string,
        description: string,
        name: string,
      } | null,
      customfield_10047: null,
      labels: string[],
      customfield_10048: {
        self: string,
        value: string,
        id: string,
      } | null,
      customfield_10049: {
        self: string,
        value: string,
        id: string,
      } | null,
      versions: {
        self: string,
        id: string,
        name: string,
        archived: boolean,
        released: boolean,
        releaseDate: string,
      }[],
      resolutiondate: string | null,
      issuelinks: {
        id: string,
        self: string,
        type: {
          id: string,
          name: string,
          inward: string,
          outward: string,
          self: string,
        },
        inwardIssue?: {
          id: string,
          key: string,
          self: string,
          fields: {
            summary: string,
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
          },
        },
        outwardIssue?: {
          id: string,
          key: string,
          self: string,
          fields: {
            summary: string,
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
          },
        },
      }[],
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

const jqlSearchPostUrl = "https://bugs.mojang.com/api/jql-search-post"

export async function jqlSearchPost(request: JqlSearchRequest, signal?: AbortSignal): Promise<JqlSearchResponse> {
  const response = await fetch(jqlSearchPostUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal,
  })
  if (response.ok) {
    return response.json() as Promise<JqlSearchResponse>
  } else {
    throw new Error(response.statusText)
  }
}
