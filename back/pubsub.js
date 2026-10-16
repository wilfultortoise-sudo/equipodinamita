import { PubSub } from 'graphql-subscriptions';

// Instancia única en memoria para publicar y escuchar eventos en tiempo real
export const pubsub = new PubSub();

// Compatibilidad bidireccional entre asyncIterator (v1/v2) y asyncIterableIterator (v3+)
if (!pubsub.asyncIterator && typeof pubsub.asyncIterableIterator === 'function') {
  pubsub.asyncIterator = function (triggers) {
    return this.asyncIterableIterator(triggers);
  };
}
if (!pubsub.asyncIterableIterator && typeof pubsub.asyncIterator === 'function') {
  pubsub.asyncIterableIterator = function (triggers) {
    return this.asyncIterator(triggers);
  };
}

// Tópicos oficiales de suscripciones
export const TOPICS = {
  PEDIDO_CREADO: 'PEDIDO_CREADO',
  PEDIDO_ACTUALIZADO: 'PEDIDO_ACTUALIZADO',
  STOCK_ACTUALIZADO: 'STOCK_ACTUALIZADO'
};
