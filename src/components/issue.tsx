import type { JqlSearchResponse } from "@/lib/api"
import { Badge } from "./ui/badge"
import { Content } from "./content"

export function Issue({
  issue,
}: {
  issue: JqlSearchResponse["issues"][number],
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-[10rem_auto] *:py-2 *:border-b">
        <div>Issue Type</div> <div className="flex flex-row items-center gap-1">
          <img src={issue.fields.issuetype.iconUrl} alt={issue.fields.issuetype.name} width={0} height={0} className="size-5" />
          <div title={issue.fields.issuetype.description}>{issue.fields.issuetype.name}</div>
        </div>
        <div>Created</div> <div>{new Date(issue.fields.created).toLocaleString()}</div>
        <div>Updated</div> <div>{new Date(issue.fields.updated).toLocaleString()}</div>
        <div>Resolved</div> <div>{issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).toLocaleString() : null}</div>
        <div>Resolution</div> <div><div title={issue.fields.resolution?.description}>{issue.fields.resolution?.name}</div></div>
        <div>Status</div> <div className="flex flex-row items-center gap-1">
          <img src={issue.fields.status.iconUrl} alt={issue.fields.status.name} width={0} height={0} className="size-4" />
          <div title={issue.fields.status.description}>{issue.fields.status.name}</div>
          <div title={issue.fields.status.statusCategory.colorName}>({issue.fields.status.statusCategory.name})</div>
        </div>
        <div>Affects Version/s</div> <div className="flex flex-wrap gap-1">
          {issue.fields.versions.map((version) => (
            <div key={version.id}>
              <Badge variant="secondary">{version.name}</Badge>
            </div>
          ))}
        </div>
        <div>Labels</div> <div className="flex flex-wrap gap-1">
          {issue.fields.labels.map((label) => (
            <div key={label}>
              <Badge variant="secondary">{label}</Badge>
            </div>
          ))}
        </div>
        <div>Confirmation Status</div> <div>{issue.fields.customfield_10054?.value}</div>
        <div>Category</div> <div>{issue.fields.customfield_10055?.map((v) => v.value).join(", ")}</div>
        <div>Game Mode</div> <div>{issue.fields.customfield_10048?.value}</div>
        <div>Area</div> <div>{issue.fields.customfield_10051?.value}</div>
        <div>Mojang Priority</div> <div>{issue.fields.customfield_10049?.value}</div>
        <div>Operating System Version</div> <div>{issue.fields.customfield_10061}</div>
        <div>Fix Version/s</div> <div className="flex flex-wrap gap-1">
          {issue.fields.fixVersions.map((fixVersion) => (
            <div key={fixVersion.id}>
              <Badge variant="secondary" title={fixVersion.description}>{fixVersion.name}</Badge>
            </div>
          ))}
        </div>
        <div>Linked Issues</div> <div className="flex flex-col">
          {issue.fields.issuelinks.map((issuelink) => {
            // TODO: status and issuetype
            const issue = (issuelink.inwardIssue ?? issuelink.outwardIssue)!
            return (
              <div key={issuelink.id} className="flex gap-1">
                <div>{issuelink.type.name}:</div>
                <div>{issuelink.inwardIssue ? issuelink.type.inward : null}{issuelink.outwardIssue ? issuelink.type.outward : null}</div>
                <div className="flex flex-row items-center gap-1">
                  <img src={issue.fields.issuetype.iconUrl} alt={issue.fields.issuetype.name} title={issue.fields.issuetype.description} width={0} height={0} className="size-4" />
                  <div className="font-bold">{issue.key}</div>
                  <div>{issue.fields.summary}</div>
                </div>
              </div>
            )
          })}
        </div>
        <div>Votes</div> <div>{issue.fields.customfield_10070 ?? 0}</div>
        <div>Watchers</div> <div>{issue.fields.watches.watchCount}</div>
        <div>CHK</div> <div>{issue.fields.customfield_10047 ? new Date(issue.fields.customfield_10047).toLocaleString() : null}</div>
        <div>ADO</div> <div>{issue.fields.customfield_10050}</div>
      </div>

      <div className="p-8 grid justify-center">
        <div className="prose prose-zinc dark:prose-invert">
          {issue.fields.description !== null ? (
            <Content content={issue.fields.description} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
