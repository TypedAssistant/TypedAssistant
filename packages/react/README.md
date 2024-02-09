# @type-assistant/react

Tools for controlling Home Assistant with React.

# `useEntity`

## Overview

The `useEntity` hook is used to fetch and subscribe to entity updates from a Home Assistant instance. It will cause a re-render when the entity changes.

> Note: if a re-render is unwanted, you can alternative use the `getEntities` function from `@typed-assistant/connection/entityStore`

### Fetching a Single Entity

To fetch and subscribe to a single entity, pass the entity ID as the first argument to the `useEntity` hook. The hook returns the entity object, or `undefined` if the entity is not found.

```tsx
const entity = useEntity("light.living_room")
```

### Fetching Multiple Entities

To fetch and subscribe to multiple entities, pass an array of entity IDs as the first argument. The hook returns an array of entity objects (or `undefined` for not found entities) in the same order as the IDs were provided.

```tsx
const [entity1, entity2] = useEntity([
  "light.living_room",
  "sensor.temperature",
])
```

### Specifying Dependencies

Optionally, you can specify an array of entity properties (dependencies) as the second argument. The component will only re-render when the specified properties change.

```tsx
const entity = useEntity("sun.sun", ["state", "attributes.next_rising"])
```

## Example

```tsx
import React from "react"
import { useEntity } from "./useEntity"
import { Text } from "ink"

function LightComponent() {
  const light = useEntity("light.living_room")

  if (!light) return <Text>Loading...</Text>
  return <Text>Living Room Light is {light.state}.</Text>
}
```

# `useOnEntityStateChange`

## Overview

The `useOnEntityStateChange` hook is designed to monitor and react to changes in the state of entities in a Home Assistant instance. It allows you to execute a callback function when the state of an entity changes, with options to filter events based on the state transition and to delay the execution of the callback.

### Basic Usage

```tsx
useOnEntityStateChange(
  entityId: EntityId,
  onChangeCallback: (entity: HassEntity, previousEntity: HassEntity | undefined) => void,
  options?: {
    callOnStartup?: boolean,
    for?: number,
    from?: string,
    to?: string,
    deps?: Array<keyof HassEntity | AnyOtherString>
  }
);
```

**Parameters:**

- `entityId`: The ID of the entity to monitor.
- `onChangeCallback`: A function that is called when the entity's state changes. It receives the current and previous state of the entity.
- `options` (optional): An object to specify additional conditions for the callback execution:
  - `callOnStartup`: If `true`, the callback is called when the hook initializes, assuming the entity matches the specified conditions.
  - `for`: Duration (in milliseconds) the new state must be maintained before calling the callback.
  - `from`: The previous state the entity must transition from for the callback to be executed.
  - `to`: The new state the entity must transition to for the callback to be executed.
  - `deps`: Specific entity properties to monitor for changes.

### Example

To monitor a light entity for turning off and execute a callback after it has been off for at least one minute, you can use the hook as follows:

```tsx
import React from "react"
import { useOnEntityStateChange } from "./useOnEntityStateChange"
import { ONE_MINUTE } from "@typed-assistant/utils/durations"
import { quietLogger } from "@typed-assistant/logger"
import { Text } from "ink"

function MyComponent() {
  useOnEntityStateChange(
    "light.living_room",
    () => {
      quietLogger.info(`The light has been off for 5 minutes.`)
    },
    { to: "off", for: 5 * ONE_MINUTE },
  )

  return null
}
```

# `useSchedule`

## Overview

The `useSchedule` hook is designed for scheduling actions within React components based on specific times, dates, or recurring schedules. It uses cron-like scheduling for recurring tasks and exact timestamps for one-time events. This flexibility makes it suitable for a variety of use cases, such as triggering notifications, fetching data at regular intervals, or executing tasks at specific times of the day.

### Scheduling Tasks

The hook takes an array of tuples. Each tuple contains a schedule string and a callback function. The schedule string can be in one of several formats:

- **Cron format**: for recurring tasks (e.g., `"*/5 * * * *"` to run every 5 minutes).
- **ISO 8601 format**: for one-time tasks based on an absolute timestamp (e.g., `"2021-12-31T23:59:59"`).
- **Day of the week and time**: for weekly recurring tasks (e.g., `"Monday@08:00"`).

The callback function is executed according to the specified schedule.

### Example

#### Scheduling a Recurring Task

```tsx
import { quietLogger } from "@typed-assistant/logger"
import { subMinutes } from "date-fns"

function ReminderComponent() {
  useSchedule([
    ["0 8 * * *", () => quietLogger.info("Time for your morning coffee!")],
    ["Monday@07:00", () => quietLogger.info("A new week begins!")],
  ])

  return null
}

function CoverController() {
  const sunState = useEntity("sun.sun", ["attributes"])
  const sunRise = subtractMinuteFromDateString(
    sunState?.attributes.next_rising,
  ) as string | undefined

  useSchedule([
    [
      sunRise,
      () =>
        callService("cover", "set_cover_position", {
          entity_id: "cover.bedroom_blinds",
          position: 50,
        }),
    ],
  ])

  return null
}

// We subtract a minute so there's no risk of `sunState?.attributes.next_rising` changing and clearing the timeout before it has the chance to run.
const subtractMinuteFromDateString = (dateString?: string) =>
  !dateString ? dateString : subMinutes(new Date(dateString), 1).toISOString()
```
