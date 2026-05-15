import InventoryItem from '../models/inventoryItem.js';
import InventoryTransaction from '../models/inventoryTransaction.js';

class InventoryService {
  async addItem({ institutionId, name, sku, category, quantity = 0, unit = 'unit', location, condition }) {
    const item = await InventoryItem.create({
      institution: institutionId,
      name,
      sku,
      category,
      quantity,
      unit,
      location,
      condition
    });

    return item;
  }

  async updateItem(id, institutionId, updates) {
    const item = await InventoryItem.findOneAndUpdate(
      { _id: id, institution: institutionId },
      updates,
      { new: true }
    );

    if (!item) {
      throw new Error('Inventory item not found');
    }

    return item;
  }

  async adjustStock(id, institutionId, change, reason, performedBy) {
    const item = await InventoryItem.findOne({ _id: id, institution: institutionId });
    if (!item) {
      throw new Error('Inventory item not found');
    }

    item.quantity = Math.max(0, item.quantity + change);
    await item.save();

    await InventoryTransaction.create({
      item: item._id,
      institution: institutionId,
      change,
      reason,
      performedBy
    });

    return item;
  }

  async listItems(institutionId, query = {}) {
    const filters = { institution: institutionId };
    if (query.category) filters.category = query.category;
    if (query.location) filters.location = query.location;
    if (query.name) filters.name = new RegExp(query.name, 'i');

    return InventoryItem.find(filters).sort({ name: 1 });
  }
}

export default new InventoryService();
