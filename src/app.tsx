import { filters, jqlSearchPost, projects, type JqlSearchRequest, type JqlSearchResponse } from "@/lib/api"
import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, type HeaderContext, type SortingState, useReactTable } from "@tanstack/react-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useInfiniteQuery, type QueryFunction } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { createLanguageDetector } from "@/lib/store"
import { ArrowDown, ArrowDown01, ArrowDown10, Loader2, Menu } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Content } from "@/components/content"

const maxResults = 25

type IssueWithConfidence = (
  & JqlSearchResponse["issues"][number]
  & { enConfidence: number | undefined }
)

type QueryKey = readonly [JqlSearchRequest["project"], JqlSearchRequest["filter"], SortingState, JqlSearchRequest["advanced"], JqlSearchRequest["search"], boolean]

const queryFn: QueryFunction<IssueWithConfidence[], QueryKey, number> = async ({
  pageParam,
  signal,
  queryKey: [project, filter, sorting, advanced, search, hideNonEnglishIssues],
}): Promise<IssueWithConfidence[]> => {
  const sortId = sorting[0]?.id
  const sortField = sortId === "Created" ? "created"
    : sortId === "Updated" ? "updated"
      : sortId === "Status" ? "status"
        : "created"
  const sortAsc = sorting[0]?.desc === false

  const response = await jqlSearchPost({
    project: project!,
    filter,
    sortField,
    sortAsc,
    advanced,
    search,
    startAt: pageParam * maxResults,
    maxResults,
    isForge: false,
    workspaceId: "",
  }, signal)
  const issues = response.issues as IssueWithConfidence[]
  if (hideNonEnglishIssues) {
    const languageDetector = await createLanguageDetector()
    if (languageDetector !== undefined) {
      await Promise.all(issues.map(async (issue) => {
        const results = await languageDetector.detect(issue.fields.summary)
        for (const { detectedLanguage, confidence } of results) {
          if (detectedLanguage === "en") {
            issue.enConfidence = confidence
            break
          }
        }
      }))
    }
  }
  return issues
}

export function App() {
  const [hideNonEnglishIssues, setHideNonEnglishIssues] = useState(false)

  const [project, setProject] = useState<JqlSearchRequest["project"] | undefined>(undefined)
  const [filter, setFilter] = useState<JqlSearchRequest["filter"]>("all")
  const [sorting, setSorting] = useState<SortingState>([{ id: "Created", desc: true }])
  const [advanced, setAdvanced] = useState<JqlSearchRequest["advanced"]>(false)
  const [search, setSearch] = useState<JqlSearchRequest["search"]>("")

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: [project!, filter, sorting, advanced, search, hideNonEnglishIssues],
    queryFn,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length < maxResults) {
        return undefined
      } else {
        return lastPageParam + 1
      }
    },
    enabled: project !== undefined,
  })
  const issues: IssueWithConfidence[] = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data?.pages],
  )

  const columns: ColumnDef<IssueWithConfidence>[] = useMemo(() => [
    {
      accessorFn: (row) => row.key,
      header: "Key",
    },
    {
      accessorFn: (row) => row.fields.summary,
      header: "Summary",
    },
    {
      id: "Created",
      accessorFn: (row) => row.fields.created,
      header: Sorter,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
    {
      id: "Updated",
      accessorFn: (row) => row.fields.updated,
      header: Sorter,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
    {
      id: "Status",
      accessorFn: (row) => row.fields.status,
      header: Sorter,
      cell: ({ getValue }) => {
        const status = getValue<JqlSearchResponse["issues"][number]["fields"]["status"]>()
        return (
          <div className="flex flex-row items-center gap-1">
            <img src={status.iconUrl} alt={status.name} width={0} height={0} className="size-4" />
            <div title={status.description}>{status.name}</div>
            <div title={status.statusCategory.colorName}>({status.statusCategory.name})</div>
          </div>
        )
      }
    },
    {
      accessorFn: (row) => row.fields.customfield_10047,
      header: "CHK",
      cell: ({ getValue }) => {
        const value = getValue<string | null>()
        return value ? new Date(value).toLocaleString() : null
      },
    },
    {
      accessorFn: (row) => row.fields.customfield_10048?.value,
      header: "Game Mode",
    },
    {
      accessorFn: (row) => row.fields.customfield_10049?.value,
      header: "Mojang Priority",
    },
    {
      accessorFn: (row) => row.fields.customfield_10050,
      header: "ADO",
    },
    {
      accessorFn: (row) => row.fields.customfield_10051?.value,
      header: "Area",
    },
    {
      accessorFn: (row) => row.fields.customfield_10054?.value,
      header: "Confirmation Status",
    },
    {
      accessorFn: (row) => row.fields.customfield_10055,
      header: "Category",
      cell: ({ getValue }) => {
        const categories = getValue<JqlSearchResponse["issues"][number]["fields"]["customfield_10055"]>()
        return categories?.map((category) => (
          <Badge key={category.id}>{category.value}</Badge>
        ))
      }
    },
    {
      accessorFn: (row) => row.fields.customfield_10061,
      header: "Operating System Version",
    },
    {
      accessorFn: (row) => row.fields.customfield_10070 ?? 0,
      header: "Votes Count",
    },
    {
      accessorFn: (row) => row.fields.fixVersions,
      header: "Fix Versions",
      cell: ({ getValue }) => {
        const fixVersions = getValue<JqlSearchResponse["issues"][number]["fields"]["fixVersions"]>()
        return fixVersions?.map((fixVersion) => (
          <Badge key={fixVersion.id} title={fixVersion.description}>{fixVersion.name}</Badge>
        ))
      }
    },
    // {
    //   accessorFn: (row) => row.fields.issuelinks,
    //   header: "Linked Issues",
    // },
    {
      accessorFn: (row) => row.fields.issuetype,
      header: "Issue Type",
      cell: ({ getValue }) => {
        const issuetype = getValue<JqlSearchResponse["issues"][number]["fields"]["issuetype"]>()
        return (
          <div className="flex flex-row items-center gap-1">
            <img src={issuetype.iconUrl} alt={issuetype.name} width={0} height={0} className="size-5" />
            <div title={issuetype.description}>{issuetype.name}</div>
          </div>
        )
      }
    },
    {
      accessorFn: (row) => row.fields.labels,
      header: "Labels",
      cell: ({ getValue }) => {
        const labels = getValue<string[]>()
        return labels.map((label) => (
          <Badge key={label}>{label}</Badge>
        ))
      }
    },
    {
      accessorFn: (row) => row.fields.resolution,
      header: "Resolution",
      cell: ({ getValue }) => {
        const resolution = getValue<JqlSearchResponse["issues"][number]["fields"]["resolution"]>()
        return (
          <div title={resolution?.description}>{resolution?.name}</div>
        )
      }
    },
    {
      accessorFn: (row) => row.fields.resolutiondate,
      header: "Resolved",
      cell: ({ getValue }) => {
        const value = getValue<string | null>()
        return value ? new Date(value).toLocaleString() : null
      }
    },
    {
      accessorFn: (row) => row.fields.versions,
      header: "Affects Versions",
      cell: ({ getValue }) => {
        const versions = getValue<JqlSearchResponse["issues"][number]["fields"]["versions"]>()
        return versions?.map((version) => (
          <Badge key={version.id} title={version.releaseDate}>{version.name}</Badge>
        ))
      }
    },
    {
      accessorFn: (row) => row.fields.watches.watchCount,
      header: "Watchers",
    },
  ], [])

  const table = useReactTable({
    data: issues,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    state: {
      sorting,
    },
  })

  const [activeIssue, setActiveIssue] = useState<IssueWithConfidence | undefined>(undefined)

  console.log(activeIssue)

  const isMobile = useIsMobile()

  return (
    <>
      <div className="h-full flex flex-col overflow-y-hidden">
        <div className="col-span-2 p-2 flex flex-row gap-2 border-b">
          <EnumSelect className="min-w-[220px]" label="Project" value={project} onValueChange={setProject} values={projects} />
          <EnumSelect className="min-w-[90px]" label="Filter" value={filter} onValueChange={setFilter} values={filters} />
          <div className="flex items-center space-x-2">
            <Switch id="advanced" checked={advanced} onCheckedChange={setAdvanced} />
            <Label htmlFor="advanced">Advanced</Label>
          </div>
          <Input
            placeholder="Search"
            onBlur={(e) => setSearch(e.currentTarget.value)}
            onKeyDown={(e) => {
              switch (e.key) {
                case "Enter": {
                  setSearch(e.currentTarget.value)
                  break
                }
                case "Escape": {
                  e.currentTarget.value = search
                  break
                }
              }
            }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuCheckboxItem
                checked={hideNonEnglishIssues}
                onCheckedChange={setHideNonEnglishIssues}
              >
                Hide non-English issues
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => setActiveIssue(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Button
                  variant="ghost"
                  disabled={isFetching || !hasNextPage}
                  onClick={() => void fetchNextPage()}
                  className="sticky left-2"
                >
                  {isFetching ? <><Loader2 className="animate-spin" />Loading...</> : hasNextPage ? "Load more" : "No more issues"}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {isMobile ? (
        <Drawer open={activeIssue !== undefined} onOpenChange={(open) => {
          if (!open) {
            setActiveIssue(undefined)
          }
        }}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>
                {activeIssue !== undefined ? (
                  <div className="h-full flex flex-col">
                    <div>{activeIssue.key}</div>
                    <div className="text-2xl">{activeIssue.fields.summary}</div>
                  </div>
                ) : null}
              </DrawerTitle>
              <DrawerDescription></DrawerDescription>
            </DrawerHeader>
            <div className="px-6 h-full overflow-y-auto">
              {activeIssue ? <Issue activeIssue={activeIssue} /> : null}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={activeIssue !== undefined} onOpenChange={(open) => {
          if (!open) {
            setActiveIssue(undefined)
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeIssue !== undefined ? (
                  <div className="h-full flex flex-col">
                    <div>{activeIssue.key}</div>
                    <div className="text-2xl font-bold">{activeIssue.fields.summary}</div>
                  </div>
                ) : null}
              </DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <div className="h-full overflow-y-auto">
              {activeIssue ? <Issue activeIssue={activeIssue} /> : null}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function Sorter<T>({ header, column }: HeaderContext<T, unknown>) {
  const direction = column.getIsSorted() || "none"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          {header.id}
          {direction === "none" ? <ArrowDown className="text-muted-foreground" /> : direction === "desc" ? <ArrowDown10 /> : <ArrowDown01 />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{header.id}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={direction} onValueChange={(value) => {
          if (value === "none") {
            column.clearSorting()
          } else {
            column.toggleSorting(value === "desc")
          }
        }}>
          <DropdownMenuRadioItem value="none"><ArrowDown />None</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="desc"><ArrowDown10 />Descending</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="asc"><ArrowDown01 />Ascending</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EnumSelect<T extends { id: string, label: string }>({
  label,
  value,
  onValueChange,
  values,
  className,
}: {
  label: string,
  value: T["id"] | undefined,
  onValueChange: (value: T["id"]) => void,
  values: readonly T[],
  className?: string,
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {values.map((item) => (
            <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function Issue({
  activeIssue,
}: {
  activeIssue: IssueWithConfidence,
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-[10rem_auto] *:py-2 *:border-b">
        <div>Created</div> <div>{new Date(activeIssue.fields.created).toLocaleString()}</div>
        <div>CHK</div> <div>{activeIssue.fields.customfield_10047 ? new Date(activeIssue.fields.customfield_10047).toLocaleString() : null}</div>
        <div>Game Mode</div> <div>{activeIssue.fields.customfield_10048?.value}</div>
        <div>Mojang Priority</div> <div>{activeIssue.fields.customfield_10049?.value}</div>
        <div>ADO</div> <div>{activeIssue.fields.customfield_10050}</div>
        <div>Area</div> <div>{activeIssue.fields.customfield_10051?.value}</div>
        <div>Confirmation Status</div> <div>{activeIssue.fields.customfield_10054?.value}</div>
        <div>Category</div> <div>{activeIssue.fields.customfield_10055?.map((v) => v.value).join(", ")}</div>
        <div>Operating System Version</div> <div>{activeIssue.fields.customfield_10061}</div>
        <div>Votes Count</div> <div>{activeIssue.fields.customfield_10070 ?? 0}</div>
        <div>Fix Versions</div> <div className="flex flex-wrap gap-1">
          {activeIssue.fields.fixVersions.map((fixVersion) => (
            <div key={fixVersion.id}>
              <Badge title={fixVersion.description}>{fixVersion.name}</Badge>
            </div>
          ))}
        </div>
        <div>Linked Issues</div> <div className="flex flex-col">
          {activeIssue.fields.issuelinks.map((issuelink) => {
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
        <div>Issue Type</div> <div className="flex flex-row items-center gap-1">
          <img src={activeIssue.fields.issuetype.iconUrl} alt={activeIssue.fields.issuetype.name} width={0} height={0} className="size-5" />
          <div title={activeIssue.fields.issuetype.description}>{activeIssue.fields.issuetype.name}</div>
        </div>
        <div>Labels</div> <div className="flex flex-wrap gap-1">
          {activeIssue.fields.labels.map((label) => (
            <div key={label}>
              <Badge>{label}</Badge>
            </div>
          ))}
        </div>
        <div>Resolution</div> <div><div title={activeIssue.fields.resolution?.description}>{activeIssue.fields.resolution?.name}</div></div>
        <div>Resolved</div> <div>{activeIssue.fields.resolutiondate ? new Date(activeIssue.fields.resolutiondate).toLocaleString() : null}</div>
        <div>Status</div> <div className="flex flex-row items-center gap-1">
          <img src={activeIssue.fields.status.iconUrl} alt={activeIssue.fields.status.name} width={0} height={0} className="size-4" />
          <div title={activeIssue.fields.status.description}>{activeIssue.fields.status.name}</div>
          <div title={activeIssue.fields.status.statusCategory.colorName}>({activeIssue.fields.status.statusCategory.name})</div>
        </div>
        <div>Affects Versions</div> <div className="flex flex-wrap gap-1">
          {activeIssue.fields.versions.map((version) => (
            <div key={version.id}>
              <Badge>{version.name}</Badge>
            </div>
          ))}
        </div>
        <div>Watchers</div> <div>{activeIssue.fields.watches.watchCount}</div>
      </div>

      <div className="p-8 grid justify-center">
        <div className="prose prose-zinc dark:prose-invert">
          {activeIssue.fields.description !== null ? (
            <Content content={activeIssue.fields.description} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
