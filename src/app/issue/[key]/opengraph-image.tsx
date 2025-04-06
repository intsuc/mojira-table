import { ImageResponse } from "next/og"
import { jqlSearchPostSingle, ParamsSchema, type Props } from "./common"
import * as v from "valibot"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default async function Image({
  params,
}: Props) {
  const { key } = v.parse(ParamsSchema, await params)
  const issue = await jqlSearchPostSingle(key)

  return new ImageResponse(
    (
      <div tw="p-16 flex flex-col w-full h-full bg-white">
        <div tw="mb-4">{issue.key}</div>
        <div tw="text-4xl font-bold">{issue.fields.summary}</div>
      </div>
    ),
    {
      ...size,
    },
  );
}
