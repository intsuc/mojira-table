import { ImageResponse } from "next/og"
import { jqlSearchPostSingle, ParamsSchema, type Props } from "./common"
import * as v from "valibot"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import type { ImageResponseOptions } from "next/server"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

const options: ImageResponseOptions = {
  ...size,
  fonts: [
    {
      name: "Inter",
      data: await readFile(join(process.cwd(), "assets/Inter_28pt-Regular.ttf")),
      weight: 400,
      style: "normal",
    },
  ],
}

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
    options,
  );
}
