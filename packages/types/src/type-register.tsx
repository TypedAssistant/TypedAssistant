export interface Register {
  // entityId
  // services
}

type EntityId = unknown
export type RegisteredEntityId = Register extends {
  entityId: infer TEntityId extends EntityId
}
  ? TEntityId
  : EntityId

type Services = unknown
export type RegisteredServices = Register extends {
  services: infer TServices extends Services
}
  ? TServices
  : Services
