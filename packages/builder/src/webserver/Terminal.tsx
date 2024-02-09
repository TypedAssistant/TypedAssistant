import { useCallback, useEffect, useState } from "react"
import { twMerge } from "tailwind-merge"
import { AppSection } from "./AppSection"
import { WSIndicator } from "./WSIndicator"
import { app } from "./api"
import { buttonStyle } from "./styles"
import { useWS } from "./useWS"

type ButtonAsyncProps = {
  onClick: () => Promise<{ error?: unknown }>
  stateLabels: {
    idle: string
    loading?: string
    error?: string
    success?: string
  }
}

const ButtonAsync = ({
  onClick,
  stateLabels: stateLabelsProp,
}: ButtonAsyncProps) => {
  const stateLabels = {
    error: "Error",
    loading: "Loading...",
    success: "Success",
    ...stateLabelsProp,
  }
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">(
    "idle",
  )

  useEffect(() => {
    if (state !== "loading" && state !== "idle") {
      const timeout = setTimeout(() => setState("idle"), 2000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [state])

  const handleClick = async () => {
    if (state !== "idle") return
    setState("loading")

    const { error } = await onClick()

    if (error) {
      setState("error")
      return
    }

    setState("success")
  }

  return (
    <button
      className={twMerge(
        buttonStyle,
        state === "loading" && "bg-blue-300 text-blue-800",
        state === "error" && "bg-red-300 text-red-800",
        state === "success" && "bg-green-300 text-green-800",
      )}
      onClick={handleClick}
    >
      {stateLabels[state]}
    </button>
  )
}

export function Terminal() {
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
            <ButtonAsync
              onClick={() => app["force-sync-with-github"].get()}
              stateLabels={{
                idle: "Force sync with remote",
                loading: "Syncing...",
                success: "Successfully synced with remote",
              }}
            />
            <ButtonAsync
              onClick={() => app["restart-app"].get()}
              stateLabels={{
                idle: "Restart app",
                loading: "Restarting app...",
                success: "App restarted",
              }}
            />
            <ButtonAsync
              onClick={() => app["restart-addon"].get()}
              stateLabels={{
                idle: "Restart addon",
                loading: "Restarting addon...",
                success: "Addon restarted",
              }}
            />
          </div>
        </>
      )}
    >
      <pre dangerouslySetInnerHTML={{ __html: content }} />
    </AppSection>
  )
}
