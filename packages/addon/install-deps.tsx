import { $ } from "bun"

$.throws(true)

const upgradeBun = async () => {
  const { exitCode, stderr } = await $`bun upgrade`

  if (exitCode) {
    console.error(`Failed to upgrade bun: ${stderr.toString().trim()}`)
    throw new Error("Failed to upgrade bun")
  }
}

const removeDeps = async () => {
  const { exitCode, stderr } = await $`rm -rf node_modules`

  if (exitCode) {
    console.error(`Failed to remove dependencies: ${stderr.toString().trim()}`)
    throw new Error("Failed to remove dependencies")
  }
}

const installDeps = async () => {
  const { exitCode, stderr } = await $`bun install`

  if (exitCode) {
    console.error(`Failed to install dependencies: ${stderr.toString().trim()}`)
    throw new Error("Failed to install dependencies")
  }
}

const withRetries = async (
  fn: () => void | Promise<void>,
  retries: number,
): Promise<void> => {
  if (retries === 0) {
    console.error(`Failed to install dependencies after ${retries} retries`)
    return
  }
  try {
    await fn()
  } catch (error) {
    console.error("Failed to install dependencies:", error)
    console.log(`Retries left: ${retries - 1}`)
    if (retries - 1 !== 0) await Bun.sleep(2000)
    return withRetries(fn, retries - 1)
  }
}

await withRetries(upgradeBun, 10)
await withRetries(removeDeps, 10)
await withRetries(installDeps, 10)
