import type { JqlSearchResponse } from "@/lib/api"
import { Badge } from "./ui/badge"
import { Content } from "./content"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { BundledLanguage } from "shiki"

export function Issue({
  issue,
  hideSummary,
  CodeBlockComponent,
}: {
  issue: JqlSearchResponse["issues"][number],
  hideSummary?: boolean,
  CodeBlockComponent: (props: { text: string, lang: BundledLanguage }) => ReactNode,
}) {
  return (
    <div className="mx-auto max-w-3xl h-full grid grid-rows-[auto_1fr] gap-4">
      {!hideSummary ? (
        <div className="flex flex-col">
          <Link
            href={`/issue/${issue.key}`}
            target="_blank"
            className="w-fit text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            {issue.key}
          </Link>
          <div className="text-2xl font-bold">{issue.fields.summary}</div>
        </div>
      ) : null}

      <div className="grid grid-cols-[auto_1fr] text-sm *:odd:pr-1 *:odd:truncate *:py-1 *:border-b">
        <div>Created</div> <div>{new Date(issue.fields.created).toLocaleString()}</div>
        <div>Updated</div> <div>{new Date(issue.fields.updated).toLocaleString()}</div>
        <div>Resolved</div> <div>{issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate).toLocaleString() : null}</div>
        <div>Resolution</div> <div><div title={issue.fields.resolution?.description}>{issue.fields.resolution?.name}</div></div>
        <div>Status</div> <div className="flex flex-row items-center gap-1">
          <Image src={issue.fields.status.iconUrl} alt={issue.fields.status.name} width={0} height={0} className="size-4" />
          <div title={issue.fields.status.description}>{issue.fields.status.name}</div>
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
                  <Image src={issue.fields.issuetype.iconUrl} alt={issue.fields.issuetype.name} title={issue.fields.issuetype.description} width={0} height={0} className="size-4" unoptimized />
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

      <div className="min-w-full prose prose-zinc dark:prose-invert">
        {issue.fields.description !== null ? (
          <Content
            content={issue.fields.description}
            CodeBlockComponent={CodeBlockComponent}
          />
        ) : null}
      </div>
    </div>
  )
}
