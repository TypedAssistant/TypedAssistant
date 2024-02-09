import { useEntity } from "@typed-assistant/react/useEntity"
import { Box, Text } from "ink"
import { startCase } from "lodash/fp"
import { useEffect } from "react"
import { connection } from "./connection"

export const App = () => {
  const sun = useEntity("sun.sun")?.state

  useEffect(() => {
    connection.callService("light", "turn_off", {
      entity_id: "light.light_front_door_hallway",
    })
  }, [])

  return (
    <Box
      display="flex"
      flexDirection="row"
      flexWrap="wrap"
      justifyContent="space-between"
    >
      <Text>Hello world!</Text>
      <Text>The sun is currently: {sun ? startCase(sun) : "Loading..."}</Text>
    </Box>
  )
}
