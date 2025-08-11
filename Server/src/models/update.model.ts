// Legacy import path shim for backwards compatibility.
// Re-export the canonical model so there is only ONE source of truth.

export {
  OrderUpdateModel,
  type OrderUpdateAttributes,
  type OrderUpdateCreationAttributes,
} from './orderUpdate.model.js';
