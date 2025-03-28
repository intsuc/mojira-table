import type { Content } from "@/lib/api"

export function Content({
  content,
}: {
  content: Content,
}) {
  switch (content.type) {
    case "bulletList": {
      return <ul><Contents contents={content.content} /></ul>
    }
    case "codeBlock": {
      return <code><Contents contents={content.content} /></code>
    }
    case "doc": {
      // TODO: check `content.version`
      return <Contents contents={content.content} />
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
          return <h1><Contents contents={content.content} /></h1>
        }
        case 2: {
          return <h2><Contents contents={content.content} /></h2>
        }
        case 3: {
          return <h3><Contents contents={content.content} /></h3>
        }
        case 4: {
          return <h4><Contents contents={content.content} /></h4>
        }
        case 5: {
          return <h5><Contents contents={content.content} /></h5>
        }
        case 6: {
          return <h6><Contents contents={content.content} /></h6>
        }
      }
    }
    case "inlineCard": {
      return <a href={content.attrs.url}>{content.attrs.url}</a>
    }
    case "listItem": {
      return <li><Contents contents={content.content} /></li>
    }
    case "orderedList": {
      // TODO: check `content.attrs.order`
      return <ol><Contents contents={content.content} /></ol>
    }
    case "paragraph": {
      return <p><Contents contents={content.content} /></p>
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
}: {
  contents?: Content[],
}) {
  return (
    <>
      {contents?.map((content, index) => (
        <Content key={index} content={content} />
      ))}
    </>
  )
}
