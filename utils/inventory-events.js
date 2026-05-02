import EventEmitter from 'node:events';

const INVENTORY_EVENTS = Object.freeze({
  CREATED: 'inventory:created',
  UPDATED: 'inventory:updated',
  DELETED: 'inventory:deleted',
});

const inventoryEventBus = new EventEmitter();

export { INVENTORY_EVENTS, inventoryEventBus };
