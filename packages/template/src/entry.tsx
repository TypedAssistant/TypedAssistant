import { WSConnection } from "@typed-assistant/react/WSConnection"
import { render } from "ink"
import { latestCommitId } from "./.gen/commit"
import { App } from "./app"
import { connection } from "./connection"

render(
  <WSConnection connection={connection} latestCommitId={latestCommitId}>
    <App />
  </WSConnection>,
  {
    // debug: true,
    // patchConsole: false,
  },
)
