import { Status } from "@typed-assistant/react/Status"
import { render } from "ink"
import { latestCommitId } from "./.gen/commit"
import { App } from "./app"
import { connection } from "@typed-assistant/connection/global"

render(
  <>
    <Status connection={connection} latestCommitId={latestCommitId} />
    <App />
  </>,
  { debug: true, patchConsole: false },
)
