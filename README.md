# TypedAssistant 💪

An alternative to low-code automation systems like Node-RED, or Home Assistant's own automation builder. Uses types from your own home assistant instance allowing autocompletion of your own entities.

## Benefits ✅

- Type-safety and autocompletions based on your own Home Assistant instance.
- Write tests for your trickier automations.
- Componentise automations to be reused.
- No spaghetti low-code to tread through (I love you really Node-RED).

## Screenshots 🖼

### Add-on UI

![The TypedAsssistant UI, displaying an example project. On the left is the output from the Ink react renderer, and on the right is debug info, including Add-on CPU and memory usage, and logs](https://github.com/TypedAssistant/TypedAssistant/blob/media/screenshots/screenshot.png)

> The TypedAsssistant UI, displaying an example project. On the left is the output from the Ink react renderer, and on the right is debug info, including Add-on CPU and memory usage, and logs

### Type-safety when calling services

![Example of type-safety when calling services](https://github.com/TypedAssistant/TypedAssistant/blob/media/screenshots/callService.gif)

### Extra type-safe utils

![Example of extra type-safe utils](https://github.com/TypedAssistant/TypedAssistant/blob/media/screenshots/notifyAndroidPhone.gif)

## Examples 💡

Here is some example code lifted directly from the TypedAssistant creator's own project

```tsx
/** app.tsx */

import { LivingRoom, notifyLivingRoom } from "./rooms/LivingRoom"
// other imports hidden for brevity...

export const App = () => {
  return (
    <Box
      display="flex"
      flexDirection="row"
      flexWrap="wrap"
      height={35}
      width={80}
      overflow="hidden"
    >
      <LivingRoom />
      <Kitchen />
      <DownstairsBathroom />
      <UpstairsBathroom />
      <Bedroom />
      <Outside
        onPersonDetectedInDriveway={useCallback(() => {
          notifyLivingRoom()
        }, [])}
      />
      <Updater />
    </Box>
  )
}

/** ./rooms/LivingRoom.tsx */

import { callService } from "@typed-assistant/utils/callService"
import { useOnEntityStateChange } from "@typed-assistant/react/useOnEntityStateChange"
// other imports hidden for brevity

// Set light to red for one second
export const notifyLivingRoom = () => {
  callService("light", "turn_on", {
    entity_id: "light.living_room_light",
    rgb_color: [255, 0, 0],
  })
  setTimeout(() => {
    callService("light", "turn_on", {
      entity_id: "light.living_room_light",
      color_temp_kelvin: 4000,
    })
  }, 1000)
}

export const LivingRoom = () => {
  const motionSensorId: GetEntityIdType<"binary_sensor"> =
    "binary_sensor.living_room_presence_sensor_presence_sensor_1"
  const tvCost = useTodaysEnergyCost({
    entityId: "sensor.living_room_tv_switch_energy_today",
  })
  const { rossAndLouiseAreInBed } = useRossAndLouiseAreInBed()

  // Schedule air-filter to come on automatically
  useSchedule([
    [
      "04:00",
      () => {
        callService("switch", "turn_on", {
          entity_id: "switch.sonoff_air_filter",
        })
      },
    ],
    [
      "07:00",
      () => {
        callService("switch", "turn_off", {
          entity_id: "switch.sonoff_air_filter",
        })
      },
    ],
  ])

  // Auto turn-off air-filter after 3 hours if turned on manually
  useOnEntityStateChange(
    "switch.sonoff_air_filter",
    () => {
      callService("switch", "turn_off", {
        entity_id: "switch.sonoff_air_filter",
      })
    },
    { to: "on", for: ONE_HOUR * 3, callOnStartup: true },
  )

  // Turn off light when tv is playing
  useOnEntityStateChange(
    "media_player.living_room_tv",
    () => {
      setAmbientLight("light.living_room_light", "off")
    },
    { to: "playing" },
  )

  useOnEntityStateChange(
    "media_player.living_room_tv",
    () => {
      setAmbientLight("light.living_room_light", "on")
    },
    { from: "playing", for: ONE_SECOND * 3 },
  )

  // Turn off lights when the household is in bed
  useEffect(() => {
    if (rossAndLouiseAreInBed) {
      setAmbientLight("light.living_room_light", "off")
    }
  }, [rossAndLouiseAreInBed])

  return (
    <RoomBox title="Living room">
      <Text>TV cost: {tvCost}</Text>
      <CoverController entityId="cover.living_room_blind" />
      <MotionLights
        lightSensorId={"light.living_room_light"}
        luxSensorId={
          "sensor.living_room_presence_sensor_light_sensor_light_level"
        }
        luxThreshold={50}
        motionSensorId={motionSensorId}
        preventLightTurnOn={() =>
          getEntities()["media_player.living_room_tv"]?.state === "playing" ||
          rossAndLouiseAreInBed
        }
      />
    </RoomBox>
  )
}

/** ./rooms/Outside.tsx */

import { ONE_MINUTE } from "@typed-assistant/utils/durations"
import { debounce } from "lodash"
// other imports hidden for brevity

export const Outside = ({
  onPersonDetectedInDriveway,
}: {
  onPersonDetectedInDriveway: () => void
}) => {
  const onPersonDetectedInDrivewayThrottled = useMemo(
    () =>
      debounce(
        () => {
          onPersonDetectedInDriveway()
        },
        ONE_MINUTE * 3,
        { leading: true, trailing: false },
      ),
    [onPersonDetectedInDriveway],
  )

  useOnEntityStateChange(
    "binary_sensor.driveway_person",
    () => {
      onPersonDetectedInDrivewayThrottled()
    },
    { to: "on" },
  )

  return null // nothing needed in CLI output
}
```

## Warning :warning:

This add-on is for people that have good knowledge of TypeScript and Bun/Node. React knowledge is required too, if you go down that route.

## Bun ❤️

Uses Bun, therefore all Bun apis are available, e.g. bun:sql and $.

## Installation 🛠️

- Copy the URL of this GitHub repo.
- Go to the Home Assistant Add-ons store.
- Add the copied URL to the add-on repository list. It should soon appear in the add-on store.
- Install the add-on.
- Once installation has finished, fill in the configuration.
  - I recommend using it [with Github integration](#with-github-integration-octocat) as this means you can [use your own IDE on your own laptop](#working-on-the-repo-locally-).
  - You can also edit the created project [directly on your HA server](#without-github-integration-shipit), via SSH or VSCode addons. This can be quite slow in my experience but very good for quick fixes.
- Start the add-on. A folder called /addon_configs/<slug>\_typed-assistant/TypedAssistant will be created.

### With Github integration :octocat:

This is recommended as it allows you to work on the repo locally on your own computer instead of via your Home Assistant instance which can be slow.

Please note that the repository should be initially empty unless you have already been through the setup process. When the add-on is first run, it will initialize the repository with template code. If the repository has been initialized before, the add-on will use those existing files, keeping everything in sync.

Once a Github repo is integrated, the remote repo becomes the source of truth. If any changes are made directly in the addon_configs folder, it is recommended to commit these ASAP as its possible they will be overwritten when the Github repo is synced again.

- Install the add-on via steps above
- Create a repository in Github. Add your git details to the add-on configuration.
  - `Github Repo`: The name of the repository to sync with.
  - `Github branch`: The branch to use for syncing.
- When the add-on runs, it will automatically poll for changes every 30 seconds.
- When a change is detected in the remote repo, your app will be restarted automatically.
- You can work on the repo locally, then push to remote. Alternatively, you can press "." on the repo's page on github.com to open the in-browser editor where you can make changes and commit directly.

### Working on the repo locally 💻

- Clone your new Github repo and cd in.
- Add a `.env.local` file to the root of the project. Include your Hass URL and token, e.g.:
  ```
  HASS_SERVER=http://192.168.86.10:8123
  HASS_TOKEN=xxxxx.yyyyy.zzzzz-00000
  ```
  **Note:** HASS_TOKEN is long-lived access token that can be generated in HA via your profile page.
- Run `bun i` to install dependencies.
- Run `bun gen:types` to generate various types from your HA instance.
- Run `bun ./src/process.tsx` to start the server.
- Commit any changes and push to your Github repo. TypedAssistant pulls from Github every 30s and will restart automatically when changes are detected.

### Without Github integration :shipit:

- Install the add-on via steps above
- A template is created in the addon_configs directory of Home Assistant
- When a change is detected in this folder, your app will be restarted automatically.
- You can access this directory in many ways, including the following Home Assistant add-ons:
  - Visual Studio Code,
  - Samba share
  - SSH Terminal

## React :atom_symbol:

[Ink](https://github.com/vadimdemedes/ink), a React renderer for the CLI, can be used to build out your home automations. This brings the benefits of React, like components and state management. Output is displayed in the Add-on UI, which is handy for debugging and logging.

See the README file in the packages/react directory for the provided hooks.

### But I don't like React! :rage3:

TypedAssistant provides some utilities for React, but you can use as much or as little React as you wish. At the heart of things, this add-on provides a bun server that can be used with any tooling you desire and we'd be excited to see people's own take on it.

## SSHing into docker 🐳

You probably won't have to do this, but just in case...

- We can use the [SSH & Web Tunnel](https://community.home-assistant.io/t/home-assistant-community-add-on-ssh-web-terminal/33820) to find our docker container and ssh into it
  - Once installed, open the Terminal add-on and run `docker ps | grep TypedAssistant`. Hopefully an entry should appear. If not, make sure the TypedAssistant add-on is installed and running.
  - Run `docker exec -it <docker id from previous command> /bin/bash`. You should now be inside the docker container.

## ENV variables ⚙️

You can change these in the add-on configuration.

`LOCALE`: Used for logging dates. Default is "en-GB".
