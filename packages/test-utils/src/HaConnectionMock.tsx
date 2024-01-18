import type { Connection, HassEntities } from "home-assistant-js-websocket"
import { act } from "@testing-library/react"
import type { RegisteredEntityId } from "@typed-assistant/types"

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

  public setEntities = <T extends RegisteredEntityId>(newEntities: {
    [key in T]: Partial<HassEntities[T]>
  }) => {
    this.getHassEntitiesCallbacks.forEach((getHassEntitiesCallback) => {
      act(() => getHassEntitiesCallback(newEntities as HassEntities))
    })
  }

  public clearHassEntitiesCallbacks = () => {
    this.getHassEntitiesCallbacks = []
  }

  public tryConnect = async () => this.connection
  public callService = async () => ({ data: "", error: undefined })
  public callApi = async () => ({ data: "", error: undefined })
  private handleConnectionError = () => {}
  private disconnect = () => {}

  constructor() {}
}
