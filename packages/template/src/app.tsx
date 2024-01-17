import { useEntity } from "@typed-assistant/react/useEntity"
import { notifyAndroidPhone } from "@typed-assistant/connection/notify"
import { Box, Text } from "ink"
import { startCase } from "lodash/fp"
import { useEffect } from "react"
import { connection } from "./connection"

export const App = () => {
  const sun = useEntity("sun.sun")?.state

  useEffect(() => {
    notifyAndroidPhone(connection, "mobile_app_ross_phone", {
      message: "Testing",
    })
  }, [])

  return (
    <Box display="flex" borderStyle="single" gap={1}>
      <Text>Hello world!</Text>
      <Text>The sun is currently: {sun ? startCase(sun) : "Loading..."}</Text>
    </Box>
  )
}
