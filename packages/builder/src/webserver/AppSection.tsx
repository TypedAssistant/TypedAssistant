import type { ReactNode } from "react"
import { twMerge } from "tailwind-merge"

export const AppSection = ({
  children,
  className,
  fullHeight = true,
  renderHeader,
  scrollable = true,
}: {
  children: ReactNode
  className?: string
  fullHeight?: boolean
  renderHeader?: () => JSX.Element
  scrollable?: boolean
}) => {
  return (
    <div
      className={twMerge(
        "p-4 text-xs max-h-dvh w-dvw md:w-auto flex flex-col",
        fullHeight ? "h-full" : "",
        scrollable ? "overflow-x-auto" : "",
        className ?? "",
      )}
    >
      {renderHeader ? (
        <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
          {renderHeader()}
        </div>
      ) : null}
      <div className={scrollable ? "overflow-x-auto" : ""}>{children}</div>
    </div>
  )
}
