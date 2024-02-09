import { Status, WSConnection } from "@typed-assistant/react/WSConnection"
import { render } from "ink"
import { latestCommitId } from "./.gen/commit"
import { App } from "./app"
import { connection } from "./connection"

render(
  <>
    <Status connection={connection} latestCommitId={latestCommitId} />
    <WSConnection connection={connection}>
      <App />
    </WSConnection>
  </>,
  { debug: true, patchConsole: false },
)
