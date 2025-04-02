import { Modal } from "./modal"

export default async function Page({
  params: _params,
}: {
  params: Promise<{ key: string }>,
}) {
  return (
    <Modal />
  )
}
