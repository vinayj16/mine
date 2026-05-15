import Todo from '../models/Todo.js';

class TodoService {
  async createTodo(todoData) {
    const todo = new Todo(todoData);
    return await todo.save();
  }

  async getTodoById(id) {
    return await Todo.findById(id);
  }

  async getAllTodos(filters = {}) {
    const query = {};
    
    if (filters.userId) query.userId = filters.userId;
    if (filters.institutionId) query.institutionId = filters.institutionId;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.important !== undefined) query.important = filters.important;
    if (filters.completed !== undefined) query.completed = filters.completed;
    
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    const sort = filters.sortBy || '-createdAt';
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const [todos, total] = await Promise.all([
      Todo.find(query).sort(sort).skip(skip).limit(limit),
      Todo.countDocuments(query)
    ]);

    return {
      todos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateTodo(id, updateData) {
    return await Todo.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async deleteTodo(id) {
    return await Todo.findByIdAndDelete(id);
  }

  async toggleComplete(id) {
    const todo = await Todo.findById(id);
    if (!todo) throw new Error('Todo not found');
    
    todo.completed = !todo.completed;
    todo.status = todo.completed ? 'done' : 'new';
    return await todo.save();
  }

  async toggleImportant(id) {
    const todo = await Todo.findById(id);
    if (!todo) throw new Error('Todo not found');
    
    todo.important = !todo.important;
    return await todo.save();
  }

  async moveToTrash(id) {
    return await Todo.findByIdAndUpdate(id, { status: 'trash', deletedAt: new Date() }, { new: true });
  }

  async restoreTodo(id) {
    return await Todo.findByIdAndUpdate(id, { status: 'new', completed: false, deletedAt: null }, { new: true });
  }

  async bulkDelete(ids) {
    return await Todo.updateMany({ _id: { $in: ids } }, { status: 'trash', deletedAt: new Date() });
  }

  async bulkMarkDone(ids) {
    return await Todo.updateMany({ _id: { $in: ids } }, { completed: true, status: 'done', completedAt: new Date() });
  }

  async bulkMarkUndone(ids) {
    return await Todo.updateMany({ _id: { $in: ids } }, { completed: false, status: 'new', completedAt: null });
  }

  async permanentDelete(id) {
    return await Todo.findByIdAndDelete(id);
  }

  async getStatistics(userId, institutionId) {
    const query = {};
    if (userId) query.userId = userId;
    if (institutionId) query.institutionId = institutionId;

    const [total, inbox, done, important, trash, byPriority, byStatus] = await Promise.all([
      Todo.countDocuments(query),
      Todo.countDocuments({ ...query, status: { $nin: ['trash', 'done'] }, completed: false }),
      Todo.countDocuments({ ...query, $or: [{ completed: true }, { status: 'done' }] }),
      Todo.countDocuments({ ...query, important: true, status: { $ne: 'trash' } }),
      Todo.countDocuments({ ...query, status: 'trash' }),
      Todo.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Todo.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    return {
      total,
      inbox,
      done,
      important,
      trash,
      byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
    };
  }

  async getTodosByDate(userId, institutionId) {
    const query = { status: { $nin: ['trash', 'done'] }, completed: false };
    if (userId) query.userId = userId;
    if (institutionId) query.institutionId = institutionId;

    const todos = await Todo.find(query).sort('-createdAt');
    
    const grouped = todos.reduce((acc, todo) => {
      const date = todo.createdAt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      if (!acc[date]) acc[date] = [];
      acc[date].push(todo);
      return acc;
    }, {});

    return grouped;
  }
}

export default new TodoService();
