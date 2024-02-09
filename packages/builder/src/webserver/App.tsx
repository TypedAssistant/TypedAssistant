import { Terminal } from "./Terminal"
import { Logs } from "./Logs"

const basePath = process.env.BASE_PATH ?? ""

const App = () => {
  return (
    <div className="grid md:grid-cols-3">
      <div className="col-span-2">
        <Terminal basePath={basePath} />
      </div>
      <div className="col-span-1">
        <Logs />
      </div>
    </div>
  )
}

export default App
