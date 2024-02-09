import { setup } from "@typed-assistant/builder/appProcess"
import { logger } from "@typed-assistant/logger"

await setup({
  entryFile: "src/entry.tsx",
  onProcessError: (message, addonUrl) => {
    logger.error({ additionalDetails: message, emoji: "🚨" }, "Process error")
    // notifyAndroidPhone(connection, "mobile_app_johns_phone", {
    //   clickAction: addonUrl,
    //   title: message,
    //   message: getPrettyTimestamp(),
    //   notification_icon: "mdi:alert",
    //   color: "#e91e63",
    //   importance: "high",
    //   channel: "ta_error",
    // })
  },
})
