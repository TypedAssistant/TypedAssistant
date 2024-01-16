export async function getSpawnText(...args: Parameters<typeof Bun.spawn>) {
  const { exitCode, exited, stderr, stdout } = Bun.spawn(...args)
  await exited
  if (exitCode === 0 || exitCode === null)
    return await Bun.readableStreamToText(stdout)
  if (!exitCode) return ""
  throw new Error(
    `Failed to run command: "${args.join(
      " ",
    )}". Exit code: ${exitCode}. Stderr: ${
      stderr ? await Bun.readableStreamToText(stderr) : "None"
    }`,
  )
}
