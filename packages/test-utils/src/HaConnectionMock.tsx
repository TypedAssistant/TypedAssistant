import type { Connection, HassEntities } from "home-assistant-js-websocket"
import { act } from "@testing-library/react"
import type { EntityId } from "@typed-assistant/types"

export class HaConnectionMock {
  public connection = {} as Connection
  private getHassEntitiesCallbacks: ((newEntities: HassEntities) => void)[] = []
  private configuration = {
    token: "xxx",
    url: "http://192.168.86.1:8123",
  }

  public getHassEntities = (callback: (newEntities: HassEntities) => void) => {
    this.getHassEntitiesCallbacks.push(callback)
    return () => {}
  }

  public clearEntities = () => {
    this.getHassEntitiesCallbacks.forEach((getHassEntitiesCallback) => {
      act(() => getHassEntitiesCallback({} as HassEntities))
    })
  }

  public setEntities = <T extends EntityId>(newEntities: {
    [key in T]: Partial<HassEntities[T]>
  }) => {
    this.getHassEntitiesCallbacks.forEach((getHassEntitiesCallback) => {
      act(() => getHassEntitiesCallback(newEntities as HassEntities))
    })
  }

  public clearHassEntitiesCallbacks = () => {
    this.getHassEntitiesCallbacks = []
  }

  public getConnection = async () => this.connection
  private handleConnectionError = () => {}
  private disconnect = () => {}

  constructor() {}
}
