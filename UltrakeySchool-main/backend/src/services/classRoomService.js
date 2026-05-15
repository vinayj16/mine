import ClassRoom from '../models/ClassRoom.js';
import mongoose from 'mongoose';

class ClassRoomService {
  async createClassRoom(roomData) {
    const existingRoom = await ClassRoom.findOne({
      roomNo: roomData.roomNo,
      institutionId: roomData.institutionId,
      academicYear: roomData.academicYear,
      isDeleted: false
    });

    if (existingRoom) {
      throw new Error('Room with this number already exists for this academic year');
    }

    const room = new ClassRoom(roomData);
    return await room.save();
  }

  async getClassRoomById(roomId) {
    return await ClassRoom.findById(roomId)
      .populate('assignedClass', 'name section')
      .populate('institutionId', 'name')
      .populate('metadata.createdBy', 'name')
      .populate('metadata.updatedBy', 'name');
  }

  async getClassRoomByRoomId(roomId) {
    return await ClassRoom.findOne({ roomId, isDeleted: false })
      .populate('assignedClass', 'name section')
      .populate('institutionId', 'name');
  }

  async getAllClassRooms(filters = {}, options = {}) {
    const {
      roomNo,
      capacity,
      status,
      roomType,
      building,
      floor,
      academicYear,
      institutionId,
      search
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'roomNo',
      sortOrder = 'asc'
    } = options;

    const query = { isDeleted: false };

    if (roomNo) query.roomNo = roomNo;
    if (capacity) query.capacity = capacity;
    if (status) query.status = status;
    if (roomType) query.roomType = roomType;
    if (building) query.building = building;
    if (floor !== undefined) query.floor = floor;
    if (academicYear) query.academicYear = academicYear;
    if (institutionId) query.institutionId = institutionId;

    if (search) {
      query.$or = [
        { roomId: { $regex: search, $options: 'i' } },
        { roomNo: { $regex: search, $options: 'i' } },
        { building: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [rooms, total] = await Promise.all([
      ClassRoom.find(query)
        .populate('assignedClass', 'name section')
        .populate('institutionId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      ClassRoom.countDocuments(query)
    ]);

    return {
      rooms,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateClassRoom(roomId, updateData) {
    const room = await ClassRoom.findById(roomId);
    if (!room) {
      throw new Error('Class room not found');
    }

    if (updateData.roomNo) {
      const existingRoom = await ClassRoom.findOne({
        _id: { $ne: roomId },
        roomNo: updateData.roomNo,
        institutionId: room.institutionId,
        academicYear: room.academicYear,
        isDeleted: false
      });

      if (existingRoom) {
        throw new Error('Room with this number already exists for this academic year');
      }
    }

    Object.assign(room, updateData);
    return await room.save();
  }

  async deleteClassRoom(roomId) {
    const room = await ClassRoom.findById(roomId);
    if (!room) {
      throw new Error('Class room not found');
    }

    room.isDeleted = true;
    return await room.save();
  }

  async getClassRoomsByInstitution(institutionId, academicYear) {
    const query = { institutionId, isDeleted: false };
    if (academicYear) query.academicYear = academicYear;

    return await ClassRoom.find(query)
      .populate('assignedClass', 'name section')
      .sort({ roomNo: 1 });
  }

  async getClassRoomsByStatus(status, institutionId) {
    const query = { status, isDeleted: false };
    if (institutionId) query.institutionId = institutionId;

    return await ClassRoom.find(query)
      .populate('assignedClass', 'name section')
      .sort({ roomNo: 1 });
  }

  async getAvailableClassRooms(institutionId, minCapacity) {
    const query = {
      institutionId,
      status: 'active',
      isDeleted: false
    };

    if (minCapacity) {
      query.capacity = { $gte: minCapacity };
    }

    return await ClassRoom.find(query)
      .sort({ capacity: 1, roomNo: 1 });
  }

  async getClassRoomsByBuilding(building, institutionId) {
    const query = { building, isDeleted: false };
    if (institutionId) query.institutionId = institutionId;

    return await ClassRoom.find(query)
      .populate('assignedClass', 'name section')
      .sort({ floor: 1, roomNo: 1 });
  }

  async getClassRoomsByFloor(floor, building, institutionId) {
    const query = { floor, isDeleted: false };
    if (building) query.building = building;
    if (institutionId) query.institutionId = institutionId;

    return await ClassRoom.find(query)
      .populate('assignedClass', 'name section')
      .sort({ roomNo: 1 });
  }

  async assignClassToRoom(roomId, classId, userId) {
    const room = await ClassRoom.findById(roomId);
    if (!room) {
      throw new Error('Class room not found');
    }

    room.assignedClass = classId;
    room.metadata.updatedBy = userId;
    return await room.save();
  }

  async unassignClassFromRoom(roomId, userId) {
    const room = await ClassRoom.findById(roomId);
    if (!room) {
      throw new Error('Class room not found');
    }

    room.assignedClass = null;
    room.metadata.updatedBy = userId;
    return await room.save();
  }

  async updateOccupancy(roomId, occupancy) {
    const room = await ClassRoom.findById(roomId);
    if (!room) {
      throw new Error('Class room not found');
    }

    if (occupancy > room.capacity) {
      throw new Error('Occupancy cannot exceed room capacity');
    }

    room.currentOccupancy = occupancy;
    return await room.save();
  }

  async addMaintenanceSchedule(roomId, maintenanceData) {
    const room = await ClassRoom.findById(roomId);
    if (!room) {
      throw new Error('Class room not found');
    }

    room.maintenanceSchedule.push(maintenanceData);
    return await room.save();
  }

  async completeMaintenanceSchedule(roomId, maintenanceId) {
    const room = await ClassRoom.findById(roomId);
    if (!room) {
      throw new Error('Class room not found');
    }

    const maintenance = room.maintenanceSchedule.id(maintenanceId);
    if (!maintenance) {
      throw new Error('Maintenance schedule not found');
    }

    maintenance.completedAt = new Date();
    return await room.save();
  }

  async getClassRoomStatistics(institutionId, academicYear) {
    const match = { isDeleted: false };
    if (institutionId) match.institutionId = mongoose.Types.ObjectId(institutionId);
    if (academicYear) match.academicYear = academicYear;

    const [
      totalRooms,
      activeRooms,
      inactiveRooms,
      totalCapacity,
      totalOccupancy,
      roomsByType,
      roomsByBuilding,
      utilizationRate
    ] = await Promise.all([
      ClassRoom.countDocuments(match),
      ClassRoom.countDocuments({ ...match, status: 'active' }),
      ClassRoom.countDocuments({ ...match, status: 'inactive' }),
      ClassRoom.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$capacity' } } }
      ]),
      ClassRoom.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$currentOccupancy' } } }
      ]),
      ClassRoom.aggregate([
        { $match: match },
        { $group: { _id: '$roomType', count: { $sum: 1 }, capacity: { $sum: '$capacity' } } },
        { $sort: { count: -1 } }
      ]),
      ClassRoom.aggregate([
        { $match: match },
        { $group: { _id: '$building', count: { $sum: 1 }, capacity: { $sum: '$capacity' } } },
        { $sort: { _id: 1 } }
      ]),
      ClassRoom.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalCapacity: { $sum: '$capacity' },
            totalOccupancy: { $sum: '$currentOccupancy' }
          }
        }
      ])
    ]);

    const utilization = utilizationRate[0];
    const utilizationPercentage = utilization
      ? ((utilization.totalOccupancy / utilization.totalCapacity) * 100).toFixed(2)
      : 0;

    return {
      totalRooms,
      activeRooms,
      inactiveRooms,
      totalCapacity: totalCapacity[0]?.total || 0,
      totalOccupancy: totalOccupancy[0]?.total || 0,
      utilizationPercentage,
      roomsByType,
      roomsByBuilding
    };
  }

  async bulkUpdateStatus(roomIds, status, userId) {
    return await ClassRoom.updateMany(
      { _id: { $in: roomIds }, isDeleted: false },
      {
        $set: {
          status,
          'metadata.updatedBy': userId,
          updatedAt: new Date()
        }
      }
    );
  }

  async searchClassRooms(searchTerm, institutionId) {
    const query = {
      $or: [
        { roomId: { $regex: searchTerm, $options: 'i' } },
        { roomNo: { $regex: searchTerm, $options: 'i' } },
        { building: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ],
      isDeleted: false
    };

    if (institutionId) query.institutionId = institutionId;

    return await ClassRoom.find(query)
      .populate('assignedClass', 'name section')
      .populate('institutionId', 'name')
      .sort({ roomNo: 1 })
      .limit(50);
  }
}

export default new ClassRoomService();
