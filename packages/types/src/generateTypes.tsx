import { logger } from "@typed-assistant/logger"
import { getHassAPI } from "@typed-assistant/utils/getHassAPI"
import { withErrorHandling } from "@typed-assistant/utils/withErrorHandling"
import { $ } from "bun"
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
    logger.error({ emoji: "❌" }, "Error: " + error.message)
    return retry(count, "Could not get entities from Home Assistant", () =>
      generateEntityIdType(count + 1),
    )
  }

  const entityIds = data.map(({ entity_id }) => entity_id).sort()
  const tsFile = `
export type GeneratedEntityId =
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
    logger.error({ emoji: "❌" }, "Error: " + error.message)
    return retry(count, "Could not get services from Home Assistant", () =>
      generateServicesType(count + 1),
    )
  }

  const tsFile = `
import type { GetEntityIdType } from "@typed-assistant/types"
export type GeneratedServices = {
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
    logger.error(
      {
        additionalDetails: error
          .map((e, index) => "   " + e.message + ": " + paths[index])
          .join("\n"),
        emoji: "❌",
      },
      "Could not generate types for MDI",
    )
    return
  }

  const tsFile = `
  /** @docs https://pictogrammers.com/library/mdi/ */
export type GeneratedMDINames = ${data
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
  const { stderr, stdout } = await $`git log -1 --pretty=format:%h`.quiet()
  if (stderr.length > 0) {
    logger.error(
      { additionalDetails: stderr.toString().trim(), emoji: "❌" },
      `Could not get the latest commit ID. Is this a git repository?`,
    )
  }
  const tsFile = `
  export const latestCommitId = "${stdout.toString() ?? ""}"
`.trimStart()

  const relativePath = "./src/.gen/commit.ts"
  await writeFileSync(relativePath, tsFile, {
    success: "Successfully generated latest commit",
    unchanged: "Latest commit unchanged",
  })
}

async function generateTypeRegister() {
  const tsFile = `
  import type { GeneratedEntityId } from "./EntityId"
  import type { GeneratedMDINames } from "./MDINames"
  import type { GeneratedServices } from "./Services"
  import {} from "@typed-assistant/types"
  
  declare module "@typed-assistant/types" {
    interface Register {
      entityId: GeneratedEntityId
      mdiNames: GeneratedMDINames
      services: GeneratedServices
    }
  }
  `.trimStart()

  const relativePath = "./src/.gen/type-register.ts"
  await writeFileSync(relativePath, tsFile, {
    success: "Successfully generated type register",
    unchanged: "Type register unchanged",
  })
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
    logger.info({ emoji: "✅" }, `${messages.success}: ${relativePath}`)
    writeFileSyncOrig(fullPath, newFileContent)
    return
  }
  logger.info({ emoji: "💪" }, `${messages.unchanged}: ${relativePath}`)
}

const retry = async (
  count: number,
  errorMessage: string,
  callback: () => Promise<void>,
) => {
  logger.error(
    { emoji: "❌" },
    `${errorMessage}. Trying again in ${(count + 1) * 10} seconds...`,
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

const prefixedExplainer = `
/** This file is generated by \`@typed-assistant/types/generateTypes\`. Do not edit it manually. */
`.trim()
