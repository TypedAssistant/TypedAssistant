import { useEntity } from "@typed-assistant/react/useEntity"
import { Box, Text } from "ink"
import { startCase } from "lodash/fp"

export const App = () => {
  const sun = useEntity("sun.sun")?.state

  return (
    <Box display="flex" borderStyle="single" gap={1}>
      <Text>Hello world!</Text>
      <Text>The sun is currently: {sun ? startCase(sun) : "Loading..."}</Text>
    </Box>
  )
}
