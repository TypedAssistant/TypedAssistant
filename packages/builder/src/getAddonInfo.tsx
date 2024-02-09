import { getSupervisorAPI } from "@typed-assistant/utils/getHassAPI"
import { withErrorHandling } from "@typed-assistant/utils/withErrorHandling"

type AddonInfoResponse = {
  result: string
  data: {
    name: string
    slug: string
    hostname: string
    description: string
    long_description: string
    advanced: boolean
    stage: string
    repository: string
    version_latest: string
    protected: boolean
    rating: number
    boot: string
    arch: string[]
    machine: any[]
    homeassistant: null
    url: string
    detached: boolean
    available: boolean
    build: boolean
    network: null
    network_description: null
    host_network: boolean
    host_pid: boolean
    host_ipc: boolean
    host_uts: boolean
    host_dbus: boolean
    full_access: boolean
    apparmor: string
    icon: boolean
    logo: boolean
    changelog: boolean
    documentation: boolean
    stdin: boolean
    hassio_api: boolean
    hassio_role: string
    auth_api: boolean
    homeassistant_api: boolean
    gpio: boolean
    usb: boolean
    uart: boolean
    kernel_modules: boolean
    devicetree: boolean
    udev: boolean
    docker_api: boolean
    video: boolean
    audio: boolean
    startup: string
    ingress: boolean
    signed: boolean
    state: string
    webui: null
    ingress_entry: string
    ingress_url: string
    ingress_port: number
    ingress_panel: boolean
    audio_input: null
    audio_output: null
    auto_update: boolean
    ip_address: string
    version: string
    update_available: boolean
    watchdog: boolean
  }
}

export const getAddonInfo = () =>
  withErrorHandling(getSupervisorAPI)<AddonInfoResponse>("/addons/self/info")
