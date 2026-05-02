import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
  {
    _id: {
      type: Number,
      required: true,
      min: 1,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    collection: 'inventory_items',
    versionKey: false,
  }
);

const InventoryItemModel = mongoose.model(
  'InventoryItem',
  inventoryItemSchema
);

export default InventoryItemModel;
