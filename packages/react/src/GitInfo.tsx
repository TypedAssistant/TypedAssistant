import { Box, Text } from "ink"

export const GitInfo = ({ latestCommitId }: { latestCommitId?: string }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      paddingX={1}
      borderStyle="single"
    >
      {latestCommitId ? <Text>Latest Commit: {latestCommitId}</Text> : null}
    </Box>
  )
}
