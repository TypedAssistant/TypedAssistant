import { useEntity } from "@typed-assistant/react/useEntity"
import { WSConnection } from "@typed-assistant/react/WSConnection"
import { Box, render, Text } from "ink"
import { startCase } from "lodash/fp"
import { latestCommitId } from "./.gen/commit"
import { connection } from "./connection"

export const App = () => {
  const sun = useEntity("sun.sun")?.state

  return (
    <Box display="flex" borderStyle="single" gap={1}>
      <Text>Hello world!</Text>
      <Text>The sun is currently: {sun ? startCase(sun) : "Loading..."}</Text>
    </Box>
  )
}

render(
  <WSConnection connection={connection} latestCommitId={latestCommitId}>
    <App />
  </WSConnection>,
  {
    // debug: true,
    // patchConsole: false,
  },
)
