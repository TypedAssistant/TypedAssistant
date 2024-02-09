import { edenTreaty } from "@elysiajs/eden"
import type { WebServer } from "../setupWebserver"
import type { EdenTreaty } from "@elysiajs/eden/treaty"

export const app: EdenTreaty.Create<WebServer> = edenTreaty<WebServer>(
  window.location.origin + process.env.BASE_PATH,
)
