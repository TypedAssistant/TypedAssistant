import { Logs } from "./Logs"
import { Stats } from "./Stats"
import { Terminal } from "./Terminal"

const basePath = process.env.BASE_PATH ?? ""

const App = () => {
  return (
    <div className="grid md:grid-cols-3">
      <div className="col-span-2">
        <Terminal />
      </div>
      <div className="col-span-1">
        <Stats />
        <Logs basePath={basePath} />
      </div>
    </div>
  )
}

export default App
