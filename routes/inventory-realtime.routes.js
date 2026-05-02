import inventoryService from '#services/inventory.service';
import { INVENTORY_EVENTS, inventoryEventBus } from '#utils/inventory-events';

const OPEN_SOCKET_STATE = 1;

function sendMessage(socket, payload, logger) {
  if (socket.readyState !== OPEN_SOCKET_STATE) {
    return false;
  }

  try {
    socket.send(JSON.stringify(payload));
    return true;
  } catch (error) {
    logger.warn({ err: error }, 'Failed to send WebSocket message');
    return false;
  }
}

async function inventoryRealtimeRoutes(fastify) {
  const clients = new Set();

  const broadcast = (payload) => {
    for (const socket of clients) {
      const delivered = sendMessage(socket, payload, fastify.log);

      if (!delivered) {
        clients.delete(socket);
      }
    }
  };

  const handleCreated = (data) => {
    broadcast({ event: 'created', data });
  };
  const handleUpdated = (data) => {
    broadcast({ event: 'updated', data });
  };
  const handleDeleted = ({ id }) => {
    broadcast({ event: 'deleted', id });
  };

  inventoryEventBus.on(INVENTORY_EVENTS.CREATED, handleCreated);
  inventoryEventBus.on(INVENTORY_EVENTS.UPDATED, handleUpdated);
  inventoryEventBus.on(INVENTORY_EVENTS.DELETED, handleDeleted);

  fastify.addHook('onClose', async () => {
    inventoryEventBus.off(INVENTORY_EVENTS.CREATED, handleCreated);
    inventoryEventBus.off(INVENTORY_EVENTS.UPDATED, handleUpdated);
    inventoryEventBus.off(INVENTORY_EVENTS.DELETED, handleDeleted);

    for (const socket of clients) {
      try {
        socket.close();
      } catch {
        // Ignore socket close errors during shutdown.
      }
    }

    clients.clear();
  });

  const handleInventorySocket = (socket, request) => {
    clients.add(socket);

    socket.on('close', () => {
      clients.delete(socket);
    });

    socket.on('error', (error) => {
      clients.delete(socket);
      request.log.warn({ err: error }, 'WebSocket client connection error');
    });

    void inventoryService
      .getList()
      .then((items) => {
        const delivered = sendMessage(
          socket,
          { event: 'snapshot', data: items },
          request.log
        );

        if (!delivered) {
          clients.delete(socket);
        }
      })
      .catch((error) => {
        request.log.error(
          { err: error },
          'Failed to load inventory snapshot for WebSocket client'
        );
      });
  };

  fastify.get('/inventory/ws', { websocket: true }, handleInventorySocket);
  fastify.get('/items/ws', { websocket: true }, handleInventorySocket);
}

export default inventoryRealtimeRoutes;
