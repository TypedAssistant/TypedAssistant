import { quietLogger } from "@typed-assistant/logger"
import { useSchedule } from "@typed-assistant/react/useSchedule"
import { callService } from "@typed-assistant/utils/callService"

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
        callService("update", "install", {
          entity_id: "update.home_assistant_core_update",
          backup: false,
        })
      },
    ],
    [
      "Saturday@05:30",
      () => {
        quietLogger.info({ emoji: "🆕" }, "Updating Home Assistant OS")
        callService("update", "install", {
          entity_id: "update.home_assistant_operating_system_update",
          backup: false,
        })
      },
    ],
    [
      "Saturday@06:30",
      () => {
        quietLogger.info({ emoji: "🆕" }, "Updating Home Assistant Supervisor")
        callService("update", "install", {
          entity_id: "update.home_assistant_supervisor_update",
          backup: false,
        })
      },
    ],
  ])
}
