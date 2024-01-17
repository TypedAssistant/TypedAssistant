import cron from "node-cron"
import { useEffect, useRef } from "react"
import type { AnyOtherString } from "./misc-types"

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
    () => void | Promise<void>
  ][]
) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const schedule = buildSchedule(...scheduleProp)
  const tasksRef = useRef<{ stop: () => void }[]>([])

  useEffect(() => {
    Object.entries(schedule).forEach(([dateString, action]) => {
      if (!dateString) return
      const dateStringIsTime = /^[\d]{1,2}:[\d]{2}/m.test(dateString)
      const dateStringIsDayOfWeek = /^mon|tue|wed|thu|fri|sat|sun/im.test(
        dateString
      )
      const dateStringIsISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/m.test(
        dateString
      )
      if (dateStringIsDayOfWeek) {
        const [dayOfWeek, time] = dateString.split("@")
        const [hours, minutes] = time.split(":")
        const task = cron.schedule(
          `${minutes} ${hours} * * ${dayOfWeek}`,
          action,
          { timezone: "Europe/London" }
        )
        tasksRef.current.push(task)
      } else if (dateStringIsISO) {
        const triggerTime = new Date(dateString)
        const now = new Date()
        if (triggerTime > now) {
          const time = Number(triggerTime) - Number(now)
          const timeoutId = setTimeout(action, time)
          tasksRef.current.push({ stop: () => clearTimeout(timeoutId) })
        }
      } else {
        const task = cron.schedule(
          dateStringIsTime ? convertTimeToCron(dateString) : dateString,
          action,
          { timezone: "Europe/London" }
        )
        tasksRef.current.push(task)
      }
    })

    return () => {
      tasksRef.current.forEach((task) => {
        task.stop()
      })
      tasksRef.current = []
    }
  }, [schedule])
}

/**
 # second (optional)
 # │ minute
 # │ │ hour
 # │ │ │ day of month
 # │ │ │ │ month
 # │ │ │ │ │ day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *
 */
const convertTimeToCron = (dateString: string) => {
  const [hours, minutes] = dateString.split(":").map(Number)
  return `${minutes} ${hours} * * *`
}
