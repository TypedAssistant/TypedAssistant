import { Box, Text } from "ink"

export const GitInfo = ({ latestCommitId }: { latestCommitId?: string }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
      paddingX={1}
      borderStyle="single"
    >
      <Text>PID: {process.pid}</Text>
      {latestCommitId ? <Text>Latest Commit: {latestCommitId}</Text> : null}
    </Box>
  )
}
