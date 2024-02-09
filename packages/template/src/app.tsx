import { useEntity } from "@typed-assistant/react/useEntity"
import { callService } from "@typed-assistant/utils/callService"
import { Box, Text } from "ink"
import { startCase } from "lodash/fp"
import { useEffect } from "react"

export const App = (): JSX.Element => {
  const sun = useEntity("sun.sun")?.state

  useEffect(() => {
    callService("light", "toggle", {
      entity_id: "light.light_front_door_hallway",
    })
  }, [])

  return (
    <Box
      borderColor="magentaBright"
      borderStyle="round"
      paddingX={1}
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
