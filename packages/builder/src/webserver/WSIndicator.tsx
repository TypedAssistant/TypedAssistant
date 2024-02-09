export function WSIndicator({ ws }: { ws?: WebSocket }) {
  return ws?.readyState === WebSocket.OPEN ? (
    <div
      title="Connected"
      className="w-4 h-4 rounded-full bg-emerald-300 text-emerald-800 text-xs uppercase"
    >
      <span className="sr-only">Connected</span>
    </div>
  ) : (
    <div
      title="Disconnected"
      className="w-4 h-4 rounded-full bg-rose-300 text-rose-800 text-xs uppercase"
    >
      <span className="sr-only">Disconnected</span>
    </div>
  )
}
