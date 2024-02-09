export interface Register {
  // entityId
  // mdiNames
  // services
}

type EntityIdDefault = string
export type EntityId = Register extends {
  entityId: infer TEntityId extends EntityIdDefault
}
  ? TEntityId
  : EntityIdDefault

type ServicesDefault = { [key: string]: unknown }
export type Services = Register extends {
  services: infer TServices extends ServicesDefault
}
  ? TServices
  : ServicesDefault

type MDINamesDefault = string
export type MDINames = Register extends {
  mdiNames: infer TMDINames extends MDINamesDefault
}
  ? TMDINames
  : MDINamesDefault

export type GetEntityIdType<TEntityType extends string> = {
  [K in EntityId]: K extends `${TEntityType}.${string}` ? K : never
}[EntityId]
