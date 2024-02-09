import { useSchedule } from "@typed-assistant/react/useSchedule"
import { connection } from "../connection"
import { quietLogger } from "@typed-assistant/logger"

/**
 * An example component that uses the useSchedule hook to
 * schedule various Home Assistant updates.
 */

export const Updater = () => {
  useUpdater()
  return null
}

const useUpdater = () => {
  useSchedule([
    [
      "Saturday@05:00",
      () => {
        quietLogger.info({ emoji: "🆕" }, "Updating Home Assistant Core")
        connection.callService("update", "install", {
          entity_id: "update.home_assistant_core_update",
          backup: false,
        })
      },
    ],
    [
      "Saturday@05:30",
      () => {
        quietLogger.info({ emoji: "🆕" }, "Updating Home Assistant OS")
        connection.callService("update", "install", {
          entity_id: "update.home_assistant_operating_system_update",
          backup: false,
        })
      },
    ],
    [
      "Saturday@06:30",
      () => {
        quietLogger.info({ emoji: "🆕" }, "Updating Home Assistant Supervisor")
        connection.callService("update", "install", {
          entity_id: "update.home_assistant_supervisor_update",
          backup: false,
        })
      },
    ],
  ])
}
