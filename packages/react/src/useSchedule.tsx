import type { AnyOtherString } from "@typed-assistant/types/misc-types"
import cron from "node-cron"
import { useEffect, useRef } from "react"

const buildSchedule = (
  ...times: [string | null | undefined, () => void | Promise<void>][]
): Schedule => {
  return Object.fromEntries(times.filter(([time]) => time))
}

export type Schedule = { [key: string]: () => void | Promise<void> }

type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday"
type Hour =
  | "00"
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "20"
  | "21"
  | "22"
  | "23"
type Minute =
  | "00"
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "20"
  | "21"
  | "22"
  | "23"
  | "24"
  | "25"
  | "26"
  | "27"
  | "28"
  | "29"
  | "30"
  | "31"
  | "32"
  | "33"
  | "34"
  | "35"
  | "36"
  | "37"
  | "38"
  | "39"
  | "40"
  | "41"
  | "42"
  | "43"
  | "44"
  | "45"
  | "46"
  | "47"
  | "48"
  | "49"
  | "50"
  | "51"
  | "52"
  | "53"
  | "54"
  | "55"
  | "56"
  | "57"
  | "58"
  | "59"
type DateString = `${DayOfWeek}@${Hour}:${Minute}`

export const useSchedule = (
  scheduleProp: [
    DateString | AnyOtherString | null | undefined,
    () => void | Promise<void>,
  ][],
) => {
  const schedule = buildSchedule(...scheduleProp)
  const actionsRef = useRef(schedule)
  actionsRef.current = schedule
  const scheduleKey = JSON.stringify(Object.keys(schedule))

  useEffect(() => {
    const tasks: { name?: string; stop: () => void }[] = []
    const dateStrings = JSON.parse(scheduleKey) as string[]

    dateStrings.forEach((dateString) => {
      if (!dateString) return
      const action = () => {
        actionsRef.current[dateString]?.()
      }
      const dateStringIsTime = /^[\d]{1,2}:[\d]{2}/m.test(dateString)
      const dateStringIsDayOfWeek = /^mon|tue|wed|thu|fri|sat|sun/im.test(
        dateString,
      )
      const dateStringIsISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/m.test(
        dateString,
      )
      if (dateStringIsDayOfWeek) {
        const [dayOfWeek, time] = dateString.split("@") as [string, string]
        const [hours, minutes] = time.split(":")
        const name = `typed-assistant-${crypto.randomUUID()}`
        const task = cron.schedule(
          `${minutes} ${hours} * * ${dayOfWeek}`,
          action,
          { name, timezone: "Europe/London" },
        )
        tasks.push({ name, stop: () => task.stop() })
      } else if (dateStringIsISO) {
        const triggerTime = new Date(dateString)
        const now = new Date()
        if (triggerTime > now) {
          const time = Number(triggerTime) - Number(now)
          const timeoutId = setTimeout(action, time)
          tasks.push({ stop: () => clearTimeout(timeoutId) })
        }
      } else {
        const name = `typed-assistant-${crypto.randomUUID()}`
        const task = cron.schedule(
          dateStringIsTime ? convertTimeToCron(dateString) : dateString,
          action,
          { name, timezone: "Europe/London" },
        )
        tasks.push({ name, stop: () => task.stop() })
      }
    })

    return () => {
      tasks.forEach((task) => {
        task.stop()
        if (task.name) cron.getTasks().delete(task.name)
      })
    }
  }, [scheduleKey])
}

/**
#### second (optional)
#### │ minute
#### │ │ hour
#### │ │ │ day of month
#### │ │ │ │ month
#### │ │ │ │ │ day of week
#### │ │ │ │ │ │
#### * * * * * *
 */
const convertTimeToCron = (dateString: string) => {
  const [hours, minutes] = dateString.split(":").map(Number)
  return `${minutes} ${hours} * * *`
}
