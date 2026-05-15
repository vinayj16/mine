import canteenService from '../services/canteenService.js';

const getInstitutionId = (req) => req.user?.schoolId || req.user?.institutionId || req.tenantId;

const createMenuItem = async (req, res, next) => {
  try {
    const institution = getInstitutionId(req);
    const item = await canteenService.createMenuItem({
      institutionId: institution,
      ...req.body
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const listMenuItems = async (req, res, next) => {
  try {
    const institution = getInstitutionId(req);
    const items = await canteenService.listMenuItems(institution, req.query);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const institution = getInstitutionId(req);
    const order = await canteenService.createOrder({
      institutionId: institution,
      orderedBy: req.user?.id,
      studentId: req.body.studentId,
      items: req.body.items || []
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const listOrders = async (req, res, next) => {
  try {
    const institution = getInstitutionId(req);
    const orders = await canteenService.listOrders(institution, req.query);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const institution = getInstitutionId(req);
    const order = await canteenService.updateOrderStatus(req.params.id, institution, req.body.status);

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const recordPayment = async (req, res, next) => {
  try {
    const institution = getInstitutionId(req);
    const payment = await canteenService.recordPayment({
      institutionId: institution,
      orderId: req.params.id,
      amount: req.body.amount,
      method: req.body.method,
      reference: req.body.reference
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};


export default {
  createMenuItem,
  listMenuItems,
  createOrder,
  listOrders,
  updateOrderStatus,
  recordPayment
};
