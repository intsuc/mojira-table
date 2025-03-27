export const projects = [
  { id: "MC", label: "Minecraft: Java Edition" },
  { id: "MCPE", label: "Minecraft: Bedrock Edition" },
  { id: "REALMS", label: "Minecraft Realms" },
  { id: "MCL", label: "Minecraft Launcher" },
  { id: "BDS", label: "Bedrock Dedicated Server" },
  { id: "WEB", label: "Mojang Web Services" },
] as const

export const filters = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
] as const

export const sortFields = [
  { id: "created", label: "Created" },
  { id: "updated", label: "Updated" },
  { id: "priority", label: "Priority" },
  { id: "status", label: "Status" },
] as const

export type JqlSearchRequest = {
  project: typeof projects[number]["id"],
  filter: typeof filters[number]["id"],
  sortField: typeof sortFields[number]["id"],
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
      customfield_10070: 0,
      created: string,
      customfield_10061: null,
      customfield_10050: null,
      customfield_10051: null,
      description: Content,
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
  return response.json()
}
