import type {
  GetEntityIdType,
  EntityId,
  MDINames,
  Services,
} from "@typed-assistant/types"
import type { AnyOtherString } from "@typed-assistant/types/misc-types"
import type { HaConnection } from "."

type Action = {
  title: string
} & (
  | {
      action: string
      uri?: never
    }
  | {
      action: "URI"
      uri: string
    }
)

type notifyAndroidOptions = {
  actions?: [Action] | [Action, Action] | [Action, Action, Action]
  clickAction?: `noAction` | `entityId:${EntityId}` | AnyOtherString
  color?: string
  icon_url?: string
  image?: `/api/camera_proxy/${GetEntityIdType<"camera">}` | AnyOtherString
  importance?:
    | "high" /** Makes a sound and appears as a heads-up notification. */
    | "low" /** Makes no sound. */
    | "min" /** Makes no sound and doesn't appear in the status bar. */
    | "default" /** Makes a sound. */
  group?: string
  message: "clear_notification" | AnyOtherString
  /** @docs https://pictogrammers.com/library/mdi/ */
  notification_icon?: `mdi:${MDINames}`
  persistent?: boolean
  sticky?: boolean
  /** The subject is rendered until the notification is expanded, where the message is rendered instead */
  subject?: string
  /** Replace an existing notification by using a tag for the notification. All subsequent notifications will take the place of a notification with the same tag. */
  tag?: string
  /** Timeout value in seconds */
  timeout?: number
  title?: string
  vibrationPattern?: number[]
  /**
   * Visibility of the notification:
   * - "public": always show all notification content
   * - "private": (default) visibility depends on your setting in the system settings
   * - "secret": always hide notification from lock screen
   */
  visibility?: "public" | "private" | "secret"
} & (
  | {
      channel: string
      /**
       * Importance levels for notifications:
       * - "high": Makes a sound and appears as a heads-up notification.
       * - "low": Makes no sound.
       * - "min": Makes no sound and doesn't appear in the status bar.
       * - "default": Makes a sound.
       */
      importance: "high" | "low" | "min" | "default"
    }
  | {
      channel?: string
      importance?: never
    }
) &
  (
    | {
        /** message must equal "TTS" when tts_text is passed */
        tts_text: string
        media_stream: "alarm_stream" | "alarm_stream_max"
      }
    | {
        tts_text?: never
        media_stream?: never
      }
  ) &
  (
    | {
        chronometer: true
        /** @example
         * // 30 seconds from now
         * Math.round(Date.now() / 1000) + 30
         * */
        when: number
      }
    | {
        chronometer?: false
        when?: never
      }
  )

export function notifyAndroidPhone(
  connection: HaConnection,
  entity: keyof Services["notify"],
  {
    message,
    title,
    importance,
    vibrationPattern,
    ...data
  }: notifyAndroidOptions,
) {
  return connection.callService("notify", entity, {
    message,
    title,
    data: {
      ...data,
      importance: importance ?? "default",
      vibrationPattern: vibrationPattern
        ? vibrationPattern.join(", ")
        : undefined,
    },
  } as never)
}
