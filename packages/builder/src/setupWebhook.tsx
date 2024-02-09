import { logger } from "@typed-assistant/logger"
import { handleFetchError } from "@typed-assistant/utils/getHassAPI"
import { withErrorHandling } from "@typed-assistant/utils/withErrorHandling"
import { z } from "zod"

const commonOptions = {
  headers: {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
  },
}

const webhookIsSetup = async (webhookUrl: string) => {
  const { error } = await fetch(webhookUrl, {
    ...commonOptions,
    body: JSON.stringify({ check: "true" }),
  })
    .then(handleFetchError)
    .then((d) => d.json())

  if (error) {
    logger.error(
      { additionalDetails: error.message, emoji: "🚨" },
      `Failed to reach webhook "${webhookUrl}"`,
    )
    return false
  }

  logger.debug({ emoji: "🪝" }, "Webhook reached successfully: ")
  return true
}

const listRepoWebhooks = async () =>
  withErrorHandling(() =>
    fetch(
      `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/hooks`,
      { ...commonOptions },
    )
      .then(handleFetchError)
      .then((d) => d?.json())
      .then(z.array(Webhook).parse),
  )()

// const deleteRepoWebhook = async (id: number) =>
//   withErrorHandling(() =>
//     fetch(
//       `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/hooks/${id}`,
//       { ...commonOptions, method: "DELETE" },
//     ),
//   )()

// const deleteAllRepoWebhooks = async () => {
//   const { data: webhooks, error } = await listRepoWebhooks()

//   if (error) {
//     logger.error("🚨 Failed fetching webhooks")
//     logger.error(`  ${error.message}`)
//     return
//   }

//   await Promise.all(
//     webhooks.map(async (webhook) => {
//       await deleteRepoWebhook(webhook.id)
//       logger.info("🚮 Webhook deleted: " + webhook.config.url)
//     }),
//   )
// }

const createRepoWebhook = async (webhookUrl: string) =>
  withErrorHandling(() =>
    fetch(
      `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/hooks`,
      {
        ...commonOptions,
        method: "POST",
        body: JSON.stringify({
          name: "web",
          active: true,
          config: {
            url: webhookUrl,
            content_type: "json",
            insecure_ssl: "0",
          },
          events: ["push"],
        }),
      },
    )
      .then(handleFetchError)
      .then((d) => d.json())
      .then(Webhook.parse),
  )()

const Webhook = z.object({
  type: z.literal("Repository"),
  id: z.number(),
  name: z.literal("web"),
  active: z.boolean(),
  events: z.array(z.string()),
  config: z.object({
    content_type: z.string(),
    insecure_ssl: z.enum(["0", "1"]),
    url: z.string(),
  }),
  updated_at: z.string(),
  created_at: z.string(),
  url: z.string(),
  test_url: z.string(),
  ping_url: z.string(),
  deliveries_url: z.string(),
  last_response: z.object({
    code: z.number().nullable(),
    status: z.string().nullable(),
    message: z.string().nullable(),
  }),
})

type Webhook = z.infer<typeof Webhook>

const retryTimeout = 2000
let retries = 0
export const setupWebhook = async (webhookUrl: string): Promise<void> => {
  const { data: webhooks, error } = await listRepoWebhooks()

  if (error) {
    if (retries < 5) {
      retries++
      logger.error(
        { emoji: "🔁" },
        `Failed fetching webhooks. Retrying setup in ${retryTimeout / 1000}s...`,
      )
      setTimeout(setupWebhook, retryTimeout)
      return
    }
    logger.error(
      { additionalDetails: error.message, emoji: "🚨" },
      "Failed fetching webhooks. Giving up.",
    )
    return
  }

  const webhookAlreadyExists = webhooks.some(
    async (webhook) => webhook.config.url === webhookUrl,
  )

  if (webhookAlreadyExists) {
    logger.info({ emoji: "🪝" }, "Webhook already set up")
    return
  }

  await webhookIsSetup(webhookUrl)

  const { data: webhook, error: createError } =
    await createRepoWebhook(webhookUrl)

  if (createError) {
    if (retries < 5) {
      retries++
      logger.error(
        { emoji: "🔁" },
        `Failed creating webhook. Retrying setup in ${retryTimeout / 1000}s...`,
      )
      setTimeout(setupWebhook, retryTimeout)
      return
    }
    logger.error(
      { additionalDetails: createError.message, emoji: "🚨" },
      "Failed creating webhook. Giving up.",
    )
    return
  }

  logger.info({ emoji: "🪝" }, "Webhook created: " + webhook.config.url)
}
