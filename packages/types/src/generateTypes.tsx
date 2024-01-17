import { log } from "@typed-assistant/logger"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync as writeFileSyncOrig,
} from "fs"
import { readdir } from "fs/promises"
import type {
  HassEntity,
  HassService as HassServiceOrig,
} from "home-assistant-js-websocket"
import { dirname, join } from "path"
import { getHassAPI } from "@typed-assistant/utils/getHassAPI"

export const generateTypes = async (options?: GenerateMDITypeOptions) =>
  Promise.all([
    generateEntityIdType(),
    generateServicesType(),
    generateMaterialDesignIconsType({ mdiPaths: options?.mdiPaths }),
    generateCommitFile(),
    generateTypeRegister(),
  ])

type HassService = Omit<HassServiceOrig, "fields" | "target"> & {
  fields: {
    [key: string]: HassServiceOrig["fields"][string] & {
      selector: {
        entity?: { domain: string }
        object?: unknown
        select?: { options?: { value: string }[] | string[] }
      }
      required: boolean
    }
  }
  target: {
    entity?: { integration?: string; domain?: string[] }[]
  }
}

async function generateEntityIdType(count = 0): Promise<void> {
  const { data, error } = await withErrorHandling(getHassAPI<HassEntity[]>)(
    `/api/states`,
  )

  if (error || !data) {
    return retry(count, "Could not get entities from Home Assistant", () =>
      generateEntityIdType(count + 1),
    )
  }

  const entityIds = data.map(({ entity_id }) => entity_id).sort()
  const tsFile = `
export type EntityId =
  | ${entityIds.map((id) => `"${id}"`).join("\n  | ")}
  `.trimStart()

  const relativePath = "./src/.gen/EntityId.ts"
  await writeFileSync(relativePath, tsFile, {
    success: "Successfully generated entity IDs",
    unchanged: "Entity IDs unchanged",
  })
}

async function generateServicesType(count = 0): Promise<void> {
  const { data, error } = await withErrorHandling(
    getHassAPI<{ domain: string; services: { [key: string]: HassService } }[]>,
  )(`/api/services`)

  if (error || !data) {
    return retry(count, "Could not get services from Home Assistant", () =>
      generateServicesType(count + 1),
    )
  }

  const tsFile = `
import type { GetEntityIdType } from "@typed-assistant/types"
export type Services = {
  ${data
    .map(
      ({ domain, services }) => `${domain}: {
    ${Object.entries(services)
      .map(
        ([service, { fields, target }]) => `${service}: {
        ${Object.entries(fields)
          .map(
            ([service, { description, example, required, selector }]) =>
              `/**
              ${description ? `@description ${description}` : ""}
              ${example ? `@example ${example}` : ""}
              **/
              ${service}${required ? "" : "?"}: ${
                typeof example === "string" && example.startsWith("[")
                  ? JSON.stringify(
                      JSON.parse(example).map((item: unknown) => typeof item),
                    ).replace(/"/g, "")
                  : selector?.object !== undefined
                    ? "Record<string, unknown>"
                    : selector?.entity?.domain !== undefined
                      ? `GetEntityIdType<"${selector?.entity?.domain}">`
                      : selector?.select?.options !== undefined
                        ? selector?.select?.options
                            .map(
                              (item: string | { value: string }) =>
                                `"${
                                  typeof item === "string"
                                    ? item
                                    : item?.value ?? ""
                                }"`,
                            )
                            .join("|")
                        : typeof example === "undefined"
                          ? "unknown"
                          : typeof example
              }`,
          )
          .join("\n\t\t\t\t")}
          ${
            target?.entity?.[0]?.domain
              ? `entity_id: GetEntityIdType<${target?.entity?.[0]?.domain
                  ?.map((domain) => `"${domain}"`)
                  .join("|")}> | GetEntityIdType<${target?.entity?.[0]?.domain
                  ?.map((domain) => `"${domain}"`)
                  .join("|")}>[]`
              : ""
          }
        [key: string]: unknown
      }`,
      )
      .join("\n\t\t")}
  }`,
    )
    .join("\n\t")}
}

  `.trimStart()

  const relativePath = "./src/.gen/Services.ts"
  await writeFileSync(relativePath, tsFile, {
    success: "Successfully generated services",
    unchanged: "Services unchanged",
  })
}

type GenerateMDITypeOptions = {
  /** Paths to the @mdi/svg/svg folder, relative to cwd.
   * Multiple paths are tried in order, and the first one that exists is used. */
  mdiPaths?: string[]
}

async function generateMaterialDesignIconsType(
  options: GenerateMDITypeOptions,
) {
  const paths =
    (options.mdiPaths?.length ?? 0) === 0
      ? ["node_modules/@mdi/svg/svg", "../../node_modules/@mdi/svg/svg"]
      : (options.mdiPaths as string[])
  const { data, error } = await readdirMany(paths)

  if (error || !data) {
    log(formatErrorMessage("Could not generate types for MDI"))
    log(
      error
        .map((e, index) => "   " + e.message + ": " + paths[index])
        .join("\n"),
    )
    return
  }

  const tsFile = `
  /** @docs https://pictogrammers.com/library/mdi/ */
export type MDINames = ${data
    .map((line) => `"${line.slice(0, -4)}"`)
    .join(" | ")}

  `.trimStart()

  const relativePath = "./src/.gen/MDINames.ts"
  await writeFileSync(relativePath, tsFile, {
    success: "Successfully generated MDI names",
    unchanged: "MDI names unchanged",
  })
}

async function generateCommitFile() {
  const { data, error } = await getFromCommand([
    "git",
    "log",
    "-1",
    "--pretty=format:%h",
  ])
  if (error) {
    log(
      formatErrorMessage(
        `Could not get the latest commit ID. Is this a git repository?`,
      ),
    )
    return
  }
  const tsFile = `
  export const latestCommitId = "${data}"
`.trimStart()

  const relativePath = "./src/.gen/commit.ts"
  await writeFileSync(relativePath, tsFile, {
    success: "Successfully generated latest commit",
    unchanged: "Latest commit unchanged",
  })
}

async function generateTypeRegister() {
  const tsFile = `
  import type { EntityId } from "./EntityId"
  import type { MDINames } from "./MDINames"
  import type { Services } from "./Services"
  import {} from "@typed-assistant/types"
  
  declare module "@typed-assistant/types" {
    interface Register {
      entityId: EntityId
      mdiNames: MDINames
      services: Services
    }
  }
  `.trimStart()

  const relativePath = "./src/.gen/type-register.ts"
  await writeFileSync(relativePath, tsFile, {
    success: "Successfully generated type register",
    unchanged: "Type register unchanged",
  })
}

const getFromCommand = async (...args: Parameters<typeof Bun.spawn>) => {
  try {
    const proc = Bun.spawn(...args)
    await proc.exited
    const text = await Bun.readableStreamToText(proc.stdout)
    if (proc.exitCode === 0) return { data: text, error: null }
    return {
      data: null,
      error: {
        signalCode: proc.signalCode,
        exitCode: proc.exitCode,
        text: text,
      },
    }
  } catch (error) {
    return { data: null, error }
  }
}

const readdirMany = async (
  paths: string[],
  currentIndex = 0,
  errors: Error[] = [],
): Promise<
  { data: string[]; error?: never } | { error: Error[]; data?: never }
> => {
  const { data, error } = await withErrorHandling((path: string) =>
    readdir(path),
  )(join(process.cwd(), paths[currentIndex] as string))

  if (error || !data) {
    if (currentIndex === paths.length - 1) {
      return { error: [...errors, error as Error] }
    }
    return readdirMany(paths, currentIndex + 1, [...errors, error as Error])
  }

  return { data }
}

const writeFileSync = async (
  relativePath: string,
  data: string,
  messages: { success: string; unchanged: string },
) => {
  const fullPath = join(process.cwd(), relativePath)
  const dir = dirname(fullPath)
  const newFileContent = prefixedExplainer + "\n\n" + data
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  if (
    !existsSync(fullPath) ||
    readFileSync(fullPath, "utf8") !== newFileContent
  ) {
    log(formatSuccessMessage(`${messages.success}: ${relativePath}`))
    writeFileSyncOrig(fullPath, newFileContent)
    return
  }
  log(formatUnchangedMessage(`${messages.unchanged}: ${relativePath}`))
}

function withErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
) {
  return async (...args: TArgs) => {
    try {
      return { data: await fn(...args), error: undefined }
    } catch (error) {
      return { data: undefined, error }
    }
  }
}

const retry = async (
  count: number,
  errorMessage: string,
  callback: () => Promise<void>,
) => {
  log(
    `${formatErrorMessage(errorMessage)}. Trying again in ${(count + 1) * 10} seconds...`,
  )
  await new Promise<void>((resolve) => {
    setTimeout(
      async () => {
        await callback()
        resolve()
      },
      (count + 1) * 10000,
    )
  })
}

function formatErrorMessage(errorMessage: string) {
  return `❌ ${errorMessage}`
}

function formatSuccessMessage(message: string) {
  return `✅ ${message}`
}

function formatUnchangedMessage(message: string) {
  return `💪 ${message}`
}

const prefixedExplainer = `
/** This file is generated by \`@typed-assistant/types/generateTypes\`. Do not edit it manually. */
`.trim()
