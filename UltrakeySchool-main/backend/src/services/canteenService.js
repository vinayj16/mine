import CanteenMenuItem from '../models/canteenMenuItem.js';
import CanteenOrder from '../models/canteenOrder.js';
import CanteenPayment from '../models/canteenPayment.js';

class CanteenService {
  async createMenuItem({ institutionId, name, description, category, price }) {
    return CanteenMenuItem.create({
      institution: institutionId,
      name,
      description,
      category,
      price
    });
  }

  async listMenuItems(institutionId, query = {}) {
    const filters = { institution: institutionId };
    if (query.category) filters.category = query.category;
    if (query.active !== undefined) filters.isActive = query.active === 'true';

    return CanteenMenuItem.find(filters).sort({ name: 1 });
  }

  async createOrder({ institutionId, orderedBy, studentId, items }) {
    const computedItems = items.map((it) => ({
      menuItem: it.menuItem,
      quantity: it.quantity,
      price: it.price
    }));

    const totalAmount = computedItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);

    return CanteenOrder.create({
      institution: institutionId,
      orderedBy,
      student: studentId,
      items: computedItems,
      totalAmount
    });
  }

  async updateOrderStatus(id, institutionId, status) {
    const order = await CanteenOrder.findOne({ _id: id, institution: institutionId });
    if (!order) {
      throw new Error('Canteen order not found');
    }

    order.status = status;
    await order.save();
    return order;
  }

  async listOrders(institutionId, filters = {}) {
    const query = { institution: institutionId };
    if (filters.status) query.status = filters.status;
    if (filters.studentId) query.student = filters.studentId;

    return CanteenOrder.find(query)
      .populate('items.menuItem', 'name category price')
      .sort({ createdAt: -1 });
  }

  async recordPayment({ institutionId, orderId, amount, method, reference }) {
    const order = await CanteenOrder.findOne({ _id: orderId, institution: institutionId });
    if (!order) {
      throw new Error('Order not found for payment');
    }

    const payment = await CanteenPayment.create({
      institution: institutionId,
      order: order._id,
      amount,
      method,
      reference,
      status: 'successful'
    });

    order.status = 'completed';
    await order.save();

    return payment;
  }
}

export default new CanteenService();
