import { logger } from "@typed-assistant/logger"
import { getSupervisorAPI } from "@typed-assistant/utils/getHassAPI"

export const restartAddon = async () => {
  if (!process.env.SUPERVISOR_TOKEN) {
    logger.fatal({ emoji: "♻️" }, "Can't restart addon. Exiting...")
    process.exit(1)
    return
  }
  logger.fatal({ emoji: "♻️" }, "Restarting addon...")
  await getSupervisorAPI(`/addons/self/restart`, { method: "POST" })
}
