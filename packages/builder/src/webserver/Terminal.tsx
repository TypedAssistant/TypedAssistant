import { useCallback, useState } from "react"
import { app } from "./api"
import { useWS } from "./useWS"
import { WSIndicator } from "./WSIndicator"
import { AppSection } from "./AppSection"

export function Terminal({ basePath }: { basePath: string }) {
  const [content, setContent] = useState("")
  const ws = useWS({
    subscribe: useCallback(() => app.ws.subscribe(), []),
    onMessage: useCallback((event) => setContent(event.data), []),
  })

  return (
    <AppSection
      renderHeader={() => (
        <>
          <h1 className="mb-2 text-2xl flex items-baseline gap-3">
            TypedAssistant <WSIndicator ws={ws.ws} />
          </h1>
          <div className="flex flex-wrap gap-2">
            <a className={buttonStyle} href={`${basePath}/restart-addon`}>
              Restart addon
            </a>
            <a className={buttonStyle} href={`${basePath}/log.txt?limit=500`}>
              View log.txt
            </a>
          </div>
        </>
      )}
    >
      <pre dangerouslySetInnerHTML={{ __html: content }} />
    </AppSection>
  )
}

const buttonStyle = "bg-slate-800 text-white px-3 py-1 rounded-md"
