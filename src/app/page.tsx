"use client"

import { useEffect, useState, useTransition, type Dispatch, type SetStateAction } from "react"
import { jqlSearchPost, type JqlSearchResponse } from "@/lib/api"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Loader2 } from "lucide-react"

const maxResults = 25

export default function Page() {
  const [page, setPage] = useState<number>(1)
  const [isPending, startTransition] = useTransition()
  const [response, setResponse] = useState<JqlSearchResponse | undefined>(undefined)
  const lastPage = response?.total ? Math.ceil(response.total / maxResults) : undefined

  useEffect(() => {
    startTransition(async () => {
      const response = await jqlSearchPost({
        advanced: false,
        search: "",
        project: "MC",
        isForge: false,
        sortField: "created",
        sortAsc: false,
        filter: "open",
        startAt: (page - 1) * maxResults,
        maxResults,
        workspaceId: "",
      })
      startTransition(() => {
        setResponse(response)
      })
    })
  }, [page])

  return (
    <div className="h-full grid grid-rows-[auto_fit-content(0)]">
      <div className="overflow-y-auto">
        {isPending ? (
          <div className="h-full grid place-items-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : response?.issues.map((issue) => (
          <div key={issue.key} className="grid grid-cols-[auto_1fr] gap-2">
            <div>{issue.key}</div>
            <div className="truncate">{issue.fields.summary}</div>
          </div>
        ))}
      </div>

      <IssuesPagination
        page={page}
        onPageChange={setPage}
        lastPage={lastPage}
      />
    </div>
  )
}

function IssuesPagination({
  page,
  onPageChange,
  lastPage,
}: {
  page: number,
  onPageChange: Dispatch<SetStateAction<number>>,
  lastPage: number | undefined,
}) {
  function Page({
    page,
    isActive,
  }: {
    page: number | undefined,
    isActive?: boolean,
  }) {
    return (
      <PaginationItem>
        <PaginationLink isActive={isActive} onClick={() => {
          if (page !== undefined) {
            onPageChange(page)
          }
        }}>
          {page === undefined ? (
            <Loader2 className="animate-spin" />
          ) : page}
        </PaginationLink>
      </PaginationItem>
    )
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => {
            if (page > 1) {
              onPageChange((prev) => prev - 1)
            }
          }} />
        </PaginationItem>

        {page > 1 ? (
          <Page page={1} />
        ) : null}
        {page > 2 ? (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        ) : null}

        <Page page={page} isActive />

        {lastPage === undefined || page < lastPage - 1 ? (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        ) : null}
        {lastPage === undefined || page < lastPage ? (
          <Page page={lastPage} />
        ) : null}

        <PaginationItem>
          <PaginationNext onClick={() => {
            if (lastPage !== undefined && page < lastPage) {
              onPageChange((prev) => prev + 1)
            }
          }} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
