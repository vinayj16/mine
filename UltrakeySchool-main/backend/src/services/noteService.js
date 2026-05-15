import Note from '../models/Note.js';

class NoteService {
  async createNote(noteData) {
    const note = new Note(noteData);
    return await note.save();
  }

  async getNoteById(id) {
    return await Note.findById(id);
  }

  async getAllNotes(filters = {}) {
    const query = {};
    
    if (filters.userId) query.userId = filters.userId;
    if (filters.institutionId) query.institutionId = filters.institutionId;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.tag) query.tag = filters.tag;
    if (filters.important !== undefined) query.important = filters.important;
    
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const sort = filters.sortBy || '-createdAt';
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      Note.find(query).sort(sort).skip(skip).limit(limit),
      Note.countDocuments(query)
    ]);

    return {
      notes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateNote(id, updateData) {
    return await Note.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async deleteNote(id) {
    return await Note.findByIdAndDelete(id);
  }

  async toggleImportant(id) {
    const note = await Note.findById(id);
    if (!note) throw new Error('Note not found');
    
    note.important = !note.important;
    return await note.save();
  }

  async moveToTrash(id) {
    return await Note.findByIdAndUpdate(id, { status: 'trash', deletedAt: new Date() }, { new: true });
  }

  async restoreNote(id) {
    return await Note.findByIdAndUpdate(id, { status: 'active', deletedAt: null }, { new: true });
  }

  async restoreAllNotes(userId, institutionId) {
    const query = { status: 'trash' };
    if (userId) query.userId = userId;
    if (institutionId) query.institutionId = institutionId;
    
    return await Note.updateMany(query, { status: 'active', deletedAt: null });
  }

  async permanentDelete(id) {
    return await Note.findByIdAndDelete(id);
  }

  async getStatistics(userId, institutionId) {
    const query = {};
    if (userId) query.userId = userId;
    if (institutionId) query.institutionId = institutionId;

    const [total, active, important, trash, byPriority, byTag] = await Promise.all([
      Note.countDocuments(query),
      Note.countDocuments({ ...query, status: 'active' }),
      Note.countDocuments({ ...query, important: true, status: 'active' }),
      Note.countDocuments({ ...query, status: 'trash' }),
      Note.aggregate([
        { $match: query },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Note.aggregate([
        { $match: query },
        { $group: { _id: '$tag', count: { $sum: 1 } } }
      ])
    ]);

    return {
      total,
      active,
      important,
      trash,
      byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      byTag: byTag.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
    };
  }

  async getNotesByTag(userId, institutionId) {
    const query = { status: 'active' };
    if (userId) query.userId = userId;
    if (institutionId) query.institutionId = institutionId;

    const notes = await Note.find(query).sort('-createdAt');
    
    const grouped = notes.reduce((acc, note) => {
      const tag = note.tag || 'other';
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(note);
      return acc;
    }, {});

    return grouped;
  }
}

export default new NoteService();
