import { ImageResponse } from "next/og"
import { jqlSearchPostSingle, ParamsSchema, type Props } from "./common"
import * as v from "valibot"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { type ImageResponseOptions } from "next/server"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

const [
  interRegular,
  interBold,
] = await Promise.all([
  readFile(join(process.cwd(), "assets/Inter_28pt-Regular.ttf")),
  readFile(join(process.cwd(), "assets/Inter_28pt-Bold.ttf")),
])

const options: ImageResponseOptions = {
  ...size,
  fonts: [
    {
      name: "Inter",
      data: interRegular,
      weight: 400,
      style: "normal",
    },
    {
      name: "Inter",
      data: interBold,
      weight: 700,
      style: "normal",
    },
  ],
}

export default async function Image({
  params,
}: Props) {
  const result = v.safeParse(ParamsSchema, await params)
  if (result.success) {
    const { key } = result.output
    const issue = await jqlSearchPostSingle(key)

    return new ImageResponse(
      (
        <div tw="p-20 flex flex-col w-full h-full bg-white">
          <div tw="mb-4 text-2xl text-zinc-600">{issue.key}</div>
          <div tw="text-7xl font-bold">{issue.fields.summary}</div>
        </div>
      ),
      options,
    );
  } else {
    return new ImageResponse(
      (
        <div></div>
      ),
      size,
    )
  }
}
