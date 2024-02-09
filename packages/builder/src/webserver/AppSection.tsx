export const AppSection = ({
  renderHeader,
  children,
}: {
  renderHeader: () => JSX.Element
  children: JSX.Element
}) => {
  return (
    <div className="p-4 text-xs h-full max-h-dvh w-dvw md:w-auto overflow-x-auto flex flex-col">
      <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
        {renderHeader()}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}
