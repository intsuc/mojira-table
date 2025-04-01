import type { Content } from "@/lib/api"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import Link from "next/link"
import type { ReactNode } from "react"
import type { BundledLanguage } from "shiki"

export function Content({
  content,
  CodeBlockComponent,
}: {
  content: Content,
  CodeBlockComponent: (props: { text: string, lang: BundledLanguage }) => ReactNode,
}) {
  switch (content.type) {
    case "bulletList": {
      return <ul><Contents contents={content.content} CodeBlockComponent={CodeBlockComponent} /></ul>
    }
    case "codeBlock": {
      const child = content.content?.[0]
      if (child?.type === "text") {
        return <CodeBlockComponent
          text={child.text}
          // TODO: validate language
          lang={(content.attrs?.language ?? "") as BundledLanguage}
        />
      } else {
        return <div className="text-red-500 font-mono">{JSON.stringify(content, null, 2)}</div>
      }
    }
    case "doc": {
      // TODO: check `content.version`
      return <Contents contents={content.content} CodeBlockComponent={CodeBlockComponent} />
    }
    case "emoji": {
      return content.attrs.text
    }
    case "hardBreak": {
      return <br />
    }
    case "heading": {
      switch (content.attrs.level) {
        case 1: {
          return <h1><Contents contents={content.content} CodeBlockComponent={CodeBlockComponent} /></h1>
        }
        case 2: {
          return <h2><Contents contents={content.content} CodeBlockComponent={CodeBlockComponent} /></h2>
        }
        case 3: {
          return <h3><Contents contents={content.content} CodeBlockComponent={CodeBlockComponent} /></h3>
        }
        case 4: {
          return <h4><Contents contents={content.content} CodeBlockComponent={CodeBlockComponent} /></h4>
        }
        case 5: {
          return <h5><Contents contents={content.content} CodeBlockComponent={CodeBlockComponent} /></h5>
        }
        case 6: {
          return <h6><Contents contents={content.content} CodeBlockComponent={CodeBlockComponent} /></h6>
        }
      }
      break
    }
    case "inlineCard": {
      return <Link href={content.attrs.url}>{content.attrs.url}</Link>
    }
    case "listItem": {
      return <li><Contents contents={content.content} CodeBlockComponent={CodeBlockComponent} /></li>
    }
    case "mention": {
      return <Badge variant="secondary">{content.attrs.text}</Badge>
    }
    case "orderedList": {
      // TODO: check `content.attrs.order`
      return <ol><Contents contents={content.content} CodeBlockComponent={CodeBlockComponent} /></ol>
    }
    case "panel": {
      return (
        <Card className="gap-0">
          <CardHeader>
            <CardTitle>
              <Content content={content.content![0]!} CodeBlockComponent={CodeBlockComponent} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Content content={content.content![1]!} CodeBlockComponent={CodeBlockComponent} />
          </CardContent>
        </Card>
      )
    }
    case "paragraph": {
      return <p><Contents contents={content.content} CodeBlockComponent={CodeBlockComponent} /></p>
    }
    case "text": {
      return content.text
    }
    default: {
      return <div className="text-red-500 font-mono">{JSON.stringify(content, null, 2)}</div>
    }
  }
}

function Contents({
  contents,
  CodeBlockComponent,
}: {
  contents?: Content[],
  CodeBlockComponent: (props: { text: string, lang: BundledLanguage }) => ReactNode,
}) {
  return (
    <>
      {contents?.map((content, index) => (
        <Content key={index} content={content} CodeBlockComponent={CodeBlockComponent} />
      ))}
    </>
  )
}
