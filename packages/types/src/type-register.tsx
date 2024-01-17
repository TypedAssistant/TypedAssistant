export interface Register {
  // entityId
  // mdiNames
  // services
}

type EntityId = string
export type RegisteredEntityId = Register extends {
  entityId: infer TEntityId extends EntityId
}
  ? TEntityId
  : EntityId

type Services = { [key: string]: unknown }
export type RegisteredServices = Register extends {
  services: infer TServices extends Services
}
  ? TServices
  : Services

type MDINames = string
export type RegisteredMDINames = Register extends {
  mdiNames: infer TMDINames extends MDINames
}
  ? TMDINames
  : MDINames

export type GetEntityIdType<TEntityType extends string> = {
  [K in RegisteredEntityId]: K extends `${TEntityType}.${string}` ? K : never
}[RegisteredEntityId]
