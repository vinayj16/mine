import { Vehicle, TransportRoute, StudentTransport, Trip, VehicleMaintenance } from '../models/Transport.js';
import logger from '../utils/logger.js';

class TransportService {
  // Vehicle Management
  async createVehicle(vehicleData, tenantId) {
    try {
      const vehicle = new Vehicle({ ...vehicleData, tenant: tenantId });
      await vehicle.save();
      logger.info(`Vehicle created: ${vehicle.vehicleNumber}`);
      return vehicle;
    } catch (error) {
      logger.error(`Error creating vehicle: ${error.message}`);
      throw error;
    }
  }

  async getVehicles(tenantId, filters = {}) {
    try {
      const { page = 1, limit = 10, status, vehicleType } = filters;
      const query = { tenant: tenantId };
      
      if (status) query.status = status;
      if (vehicleType) query.vehicleType = vehicleType;

      const vehicles = await Vehicle.find(query)
        .populate('driver')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await Vehicle.countDocuments(query);

      return {
        vehicles,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching vehicles: ${error.message}`);
      throw error;
    }
  }

  async getVehicleById(vehicleId, tenantId) {
    try {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, tenant: tenantId })
        .populate('driver');
      
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      return vehicle;
    } catch (error) {
      logger.error(`Error fetching vehicle: ${error.message}`);
      throw error;
    }
  }

  async updateVehicle(vehicleId, tenantId, updateData) {
    try {
      const vehicle = await Vehicle.findOneAndUpdate(
        { _id: vehicleId, tenant: tenantId },
        updateData,
        { new: true, runValidators: true }
      ).populate('driver');

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      logger.info(`Vehicle updated: ${vehicle.vehicleNumber}`);
      return vehicle;
    } catch (error) {
      logger.error(`Error updating vehicle: ${error.message}`);
      throw error;
    }
  }

  async deleteVehicle(vehicleId, tenantId) {
    try {
      // Check if vehicle is assigned to any active route
      const activeRoute = await TransportRoute.findOne({
        vehicle: vehicleId,
        tenant: tenantId,
        status: 'Active',
      });

      if (activeRoute) {
        throw new Error('Cannot delete vehicle assigned to active route');
      }

      const vehicle = await Vehicle.findOneAndDelete({ _id: vehicleId, tenant: tenantId });

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      logger.info(`Vehicle deleted: ${vehicle.vehicleNumber}`);
      return vehicle;
    } catch (error) {
      logger.error(`Error deleting vehicle: ${error.message}`);
      throw error;
    }
  }

  // Route Management
  async createRoute(routeData, tenantId) {
    try {
      // Verify vehicle exists and is available
      const vehicle = await Vehicle.findOne({ _id: routeData.vehicle, tenant: tenantId });
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      const route = new TransportRoute({ ...routeData, tenant: tenantId });
      await route.save();
      await route.populate(['vehicle', 'driver']);
      
      logger.info(`Route created: ${route.routeName}`);
      return route;
    } catch (error) {
      logger.error(`Error creating route: ${error.message}`);
      throw error;
    }
  }

  async getRoutes(tenantId, filters = {}) {
    try {
      const { page = 1, limit = 10, status } = filters;
      const query = { tenant: tenantId };
      
      if (status) query.status = status;

      const routes = await TransportRoute.find(query)
        .populate(['vehicle', 'driver'])
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await TransportRoute.countDocuments(query);

      return {
        routes,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching routes: ${error.message}`);
      throw error;
    }
  }

  async getRouteById(routeId, tenantId) {
    try {
      const route = await TransportRoute.findOne({ _id: routeId, tenant: tenantId })
        .populate(['vehicle', 'driver']);
      
      if (!route) {
        throw new Error('Route not found');
      }

      return route;
    } catch (error) {
      logger.error(`Error fetching route: ${error.message}`);
      throw error;
    }
  }

  async updateRoute(routeId, tenantId, updateData) {
    try {
      const route = await TransportRoute.findOneAndUpdate(
        { _id: routeId, tenant: tenantId },
        updateData,
        { new: true, runValidators: true }
      ).populate(['vehicle', 'driver']);

      if (!route) {
        throw new Error('Route not found');
      }

      logger.info(`Route updated: ${route.routeName}`);
      return route;
    } catch (error) {
      logger.error(`Error updating route: ${error.message}`);
      throw error;
    }
  }

  async deleteRoute(routeId, tenantId) {
    try {
      // Check if route has active student assignments
      const activeAssignments = await StudentTransport.countDocuments({
        route: routeId,
        tenant: tenantId,
        status: 'Active',
      });

      if (activeAssignments > 0) {
        throw new Error('Cannot delete route with active student assignments');
      }

      const route = await TransportRoute.findOneAndDelete({ _id: routeId, tenant: tenantId });

      if (!route) {
        throw new Error('Route not found');
      }

      logger.info(`Route deleted: ${route.routeName}`);
      return route;
    } catch (error) {
      logger.error(`Error deleting route: ${error.message}`);
      throw error;
    }
  }

  // Student Transport Assignment
  async assignStudentToRoute(assignmentData, tenantId) {
    try {
      // Verify route exists and has capacity
      const route = await TransportRoute.findOne({ _id: assignmentData.route, tenant: tenantId })
        .populate('vehicle');
      
      if (!route) {
        throw new Error('Route not found');
      }

      // Check current capacity
      const currentAssignments = await StudentTransport.countDocuments({
        route: assignmentData.route,
        tenant: tenantId,
        status: 'Active',
      });

      if (currentAssignments >= route.vehicle.capacity) {
        throw new Error('Route is at full capacity');
      }

      // Check if student already has an active assignment
      const existingAssignment = await StudentTransport.findOne({
        student: assignmentData.student,
        tenant: tenantId,
        status: 'Active',
      });

      if (existingAssignment) {
        throw new Error('Student already has an active transport assignment');
      }

      const assignment = new StudentTransport({ ...assignmentData, tenant: tenantId });
      await assignment.save();
      await assignment.populate(['student', 'route']);
      
      logger.info(`Student assigned to route: ${assignment._id}`);
      return assignment;
    } catch (error) {
      logger.error(`Error assigning student to route: ${error.message}`);
      throw error;
    }
  }

  async getStudentTransports(tenantId, filters = {}) {
    try {
      const { page = 1, limit = 10, status, routeId, studentId } = filters;
      const query = { tenant: tenantId };
      
      if (status) query.status = status;
      if (routeId) query.route = routeId;
      if (studentId) query.student = studentId;

      const assignments = await StudentTransport.find(query)
        .populate(['student', 'route'])
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await StudentTransport.countDocuments(query);

      return {
        assignments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching student transports: ${error.message}`);
      throw error;
    }
  }

  async updateStudentTransport(assignmentId, tenantId, updateData) {
    try {
      const assignment = await StudentTransport.findOneAndUpdate(
        { _id: assignmentId, tenant: tenantId },
        updateData,
        { new: true, runValidators: true }
      ).populate(['student', 'route']);

      if (!assignment) {
        throw new Error('Student transport assignment not found');
      }

      logger.info(`Student transport updated: ${assignment._id}`);
      return assignment;
    } catch (error) {
      logger.error(`Error updating student transport: ${error.message}`);
      throw error;
    }
  }

  async deleteStudentTransport(assignmentId, tenantId) {
    try {
      const assignment = await StudentTransport.findOneAndDelete({
        _id: assignmentId,
        tenant: tenantId,
      });

      if (!assignment) {
        throw new Error('Student transport assignment not found');
      }

      logger.info(`Student transport deleted: ${assignment._id}`);
      return assignment;
    } catch (error) {
      logger.error(`Error deleting student transport: ${error.message}`);
      throw error;
    }
  }

  // Trip Management
  async createTrip(tripData, tenantId) {
    try {
      const trip = new Trip({ ...tripData, tenant: tenantId });
      await trip.save();
      await trip.populate(['route', 'vehicle', 'driver']);
      
      logger.info(`Trip created: ${trip._id}`);
      return trip;
    } catch (error) {
      logger.error(`Error creating trip: ${error.message}`);
      throw error;
    }
  }

  async startTrip(tripId, tenantId, startData) {
    try {
      const trip = await Trip.findOneAndUpdate(
        { _id: tripId, tenant: tenantId, status: 'Scheduled' },
        {
          status: 'InProgress',
          startTime: new Date(),
          startOdometer: startData.startOdometer,
        },
        { new: true }
      ).populate(['route', 'vehicle', 'driver']);

      if (!trip) {
        throw new Error('Trip not found or already started');
      }

      logger.info(`Trip started: ${trip._id}`);
      return trip;
    } catch (error) {
      logger.error(`Error starting trip: ${error.message}`);
      throw error;
    }
  }

  async markAttendance(tripId, tenantId, attendanceData) {
    try {
      const trip = await Trip.findOne({ _id: tripId, tenant: tenantId });

      if (!trip) {
        throw new Error('Trip not found');
      }

      if (trip.status !== 'InProgress') {
        throw new Error('Can only mark attendance for trips in progress');
      }

      // Add or update attendance record
      const existingIndex = trip.attendance.findIndex(
        a => a.student.toString() === attendanceData.student
      );

      if (existingIndex >= 0) {
        trip.attendance[existingIndex] = {
          ...trip.attendance[existingIndex],
          ...attendanceData,
          boardingTime: new Date(),
        };
      } else {
        trip.attendance.push({
          ...attendanceData,
          boardingTime: new Date(),
        });
      }

      await trip.save();
      await trip.populate(['route', 'vehicle', 'driver', 'attendance.student']);

      logger.info(`Attendance marked for trip: ${trip._id}`);
      return trip;
    } catch (error) {
      logger.error(`Error marking attendance: ${error.message}`);
      throw error;
    }
  }

  async completeTrip(tripId, tenantId, endData) {
    try {
      const trip = await Trip.findOneAndUpdate(
        { _id: tripId, tenant: tenantId, status: 'InProgress' },
        {
          status: 'Completed',
          endTime: new Date(),
          endOdometer: endData.endOdometer,
          fuelUsed: endData.fuelUsed,
          remarks: endData.remarks,
        },
        { new: true }
      ).populate(['route', 'vehicle', 'driver']);

      if (!trip) {
        throw new Error('Trip not found or not in progress');
      }

      logger.info(`Trip completed: ${trip._id}`);
      return trip;
    } catch (error) {
      logger.error(`Error completing trip: ${error.message}`);
      throw error;
    }
  }

  async getTrips(tenantId, filters = {}) {
    try {
      const { page = 1, limit = 10, status, routeId, date, tripType } = filters;
      const query = { tenant: tenantId };
      
      if (status) query.status = status;
      if (routeId) query.route = routeId;
      if (tripType) query.tripType = tripType;
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.date = { $gte: startDate, $lt: endDate };
      }

      const trips = await Trip.find(query)
        .populate(['route', 'vehicle', 'driver', 'attendance.student'])
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ date: -1, createdAt: -1 });

      const total = await Trip.countDocuments(query);

      return {
        trips,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching trips: ${error.message}`);
      throw error;
    }
  }

  // Vehicle Maintenance
  async scheduleMaintenance(maintenanceData, tenantId) {
    try {
      const maintenance = new VehicleMaintenance({ ...maintenanceData, tenant: tenantId });
      await maintenance.save();
      await maintenance.populate('vehicle');
      
      logger.info(`Maintenance scheduled: ${maintenance._id}`);
      return maintenance;
    } catch (error) {
      logger.error(`Error scheduling maintenance: ${error.message}`);
      throw error;
    }
  }

  async updateMaintenance(maintenanceId, tenantId, updateData) {
    try {
      const maintenance = await VehicleMaintenance.findOneAndUpdate(
        { _id: maintenanceId, tenant: tenantId },
        updateData,
        { new: true, runValidators: true }
      ).populate('vehicle');

      if (!maintenance) {
        throw new Error('Maintenance record not found');
      }

      logger.info(`Maintenance updated: ${maintenance._id}`);
      return maintenance;
    } catch (error) {
      logger.error(`Error updating maintenance: ${error.message}`);
      throw error;
    }
  }

  async getMaintenanceRecords(tenantId, filters = {}) {
    try {
      const { page = 1, limit = 10, status, vehicleId, maintenanceType } = filters;
      const query = { tenant: tenantId };
      
      if (status) query.status = status;
      if (vehicleId) query.vehicle = vehicleId;
      if (maintenanceType) query.maintenanceType = maintenanceType;

      const records = await VehicleMaintenance.find(query)
        .populate('vehicle')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ scheduledDate: -1 });

      const total = await VehicleMaintenance.countDocuments(query);

      return {
        records,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching maintenance records: ${error.message}`);
      throw error;
    }
  }

  async deleteMaintenance(maintenanceId, tenantId) {
    try {
      const maintenance = await VehicleMaintenance.findOneAndDelete({
        _id: maintenanceId,
        tenant: tenantId,
      });

      if (!maintenance) {
        throw new Error('Maintenance record not found');
      }

      logger.info(`Maintenance deleted: ${maintenance._id}`);
      return maintenance;
    } catch (error) {
      logger.error(`Error deleting maintenance: ${error.message}`);
      throw error;
    }
  }

  // Statistics and Reports
  async getTransportStats(tenantId) {
    try {
      const [
        totalVehicles,
        activeVehicles,
        totalRoutes,
        activeRoutes,
        totalStudents,
        activeStudents,
        todayTrips,
        pendingMaintenance,
      ] = await Promise.all([
        Vehicle.countDocuments({ tenant: tenantId }),
        Vehicle.countDocuments({ tenant: tenantId, status: 'Active' }),
        TransportRoute.countDocuments({ tenant: tenantId }),
        TransportRoute.countDocuments({ tenant: tenantId, status: 'Active' }),
        StudentTransport.countDocuments({ tenant: tenantId }),
        StudentTransport.countDocuments({ tenant: tenantId, status: 'Active' }),
        Trip.countDocuments({
          tenant: tenantId,
          date: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        }),
        VehicleMaintenance.countDocuments({
          tenant: tenantId,
          status: { $in: ['Scheduled', 'InProgress'] },
        }),
      ]);

      return {
        vehicles: {
          total: totalVehicles,
          active: activeVehicles,
          inactive: totalVehicles - activeVehicles,
        },
        routes: {
          total: totalRoutes,
          active: activeRoutes,
          inactive: totalRoutes - activeRoutes,
        },
        students: {
          total: totalStudents,
          active: activeStudents,
          inactive: totalStudents - activeStudents,
        },
        trips: {
          today: todayTrips,
        },
        maintenance: {
          pending: pendingMaintenance,
        },
      };
    } catch (error) {
      logger.error(`Error fetching transport stats: ${error.message}`);
      throw error;
    }
  }

  async getVehicleUtilization(tenantId, startDate, endDate) {
    try {
      const trips = await Trip.find({
        tenant: tenantId,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: 'Completed',
      }).populate('vehicle');

      const utilization = {};

      trips.forEach(trip => {
        const vehicleId = trip.vehicle._id.toString();
        if (!utilization[vehicleId]) {
          utilization[vehicleId] = {
            vehicle: trip.vehicle,
            totalTrips: 0,
            totalDistance: 0,
            totalFuel: 0,
          };
        }

        utilization[vehicleId].totalTrips++;
        if (trip.endOdometer && trip.startOdometer) {
          utilization[vehicleId].totalDistance += trip.endOdometer - trip.startOdometer;
        }
        if (trip.fuelUsed) {
          utilization[vehicleId].totalFuel += trip.fuelUsed;
        }
      });

      return Object.values(utilization);
    } catch (error) {
      logger.error(`Error fetching vehicle utilization: ${error.message}`);
      throw error;
    }
  }

  // GPS Tracking
  async updateVehicleLocation(vehicleId, tenantId, locationData) {
    try {
      const { latitude, longitude, speed, heading, timestamp } = locationData;

      const vehicle = await Vehicle.findOneAndUpdate(
        { _id: vehicleId, tenant: tenantId },
        {
          $set: {
            'currentLocation.latitude': latitude,
            'currentLocation.longitude': longitude,
            'currentLocation.speed': speed,
            'currentLocation.heading': heading,
            'currentLocation.lastUpdated': timestamp || new Date(),
          },
          $push: {
            locationHistory: {
              $each: [{
                latitude,
                longitude,
                speed,
                heading,
                timestamp: timestamp || new Date(),
              }],
              $slice: -100, // Keep last 100 locations
            },
          },
        },
        { new: true }
      );

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Emit real-time location update via WebSocket
      // socketService.emit('vehicle:location', { vehicleId, location: locationData });

      return vehicle;
    } catch (error) {
      logger.error(`Error updating vehicle location: ${error.message}`);
      throw error;
    }
  }

  async getVehicleLocation(vehicleId, tenantId) {
    try {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, tenant: tenantId })
        .select('vehicleNumber currentLocation')
        .populate('driver', 'firstName lastName phone');

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      return vehicle;
    } catch (error) {
      logger.error(`Error fetching vehicle location: ${error.message}`);
      throw error;
    }
  }

  async trackRoute(routeId, tenantId) {
    try {
      const route = await TransportRoute.findOne({ _id: routeId, tenant: tenantId })
        .populate('vehicle');

      if (!route) {
        throw new Error('Route not found');
      }

      const vehicle = await this.getVehicleLocation(route.vehicle._id, tenantId);

      return {
        route,
        currentLocation: vehicle.currentLocation,
        stops: route.stops,
        estimatedArrival: this.calculateETA(vehicle.currentLocation, route.stops),
      };
    } catch (error) {
      logger.error(`Error tracking route: ${error.message}`);
      throw error;
    }
  }

  async getParentTrackingInfo(studentId, tenantId) {
    try {
      const assignment = await StudentTransport.findOne({
        student: studentId,
        tenant: tenantId,
        status: 'Active',
      }).populate(['route', 'student']);

      if (!assignment) {
        throw new Error('No active transport assignment found for student');
      }

      const route = await TransportRoute.findById(assignment.route._id)
        .populate('vehicle driver');

      const vehicle = await this.getVehicleLocation(route.vehicle._id, tenantId);

      // Find student's stop
      const studentStop = route.stops.find(
        stop => stop.students && stop.students.some(s => s.toString() === studentId)
      );

      return {
        student: assignment.student,
        route: {
          name: route.routeName,
          vehicleNumber: route.vehicle.vehicleNumber,
          driver: {
            name: `${route.driver.firstName} ${route.driver.lastName}`,
            phone: route.driver.phone,
          },
        },
        currentLocation: vehicle.currentLocation,
        studentStop,
        estimatedArrival: studentStop
          ? this.calculateETA(vehicle.currentLocation, [studentStop])
          : null,
      };
    } catch (error) {
      logger.error(`Error fetching parent tracking info: ${error.message}`);
      throw error;
    }
  }

  calculateETA(currentLocation, stops) {
    // Simple ETA calculation based on distance and average speed
    // In production, integrate with Google Maps API or similar
    if (!currentLocation || !stops || stops.length === 0) {
      return null;
    }

    const averageSpeed = 30; // km/h
    const nextStop = stops[0];

    if (!nextStop.latitude || !nextStop.longitude) {
      return null;
    }

    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      nextStop.latitude,
      nextStop.longitude
    );

    const timeInHours = distance / averageSpeed;
    const etaMinutes = Math.round(timeInHours * 60);

    return {
      stopName: nextStop.stopName,
      distance: distance.toFixed(2),
      estimatedMinutes: etaMinutes,
      estimatedTime: new Date(Date.now() + etaMinutes * 60000),
    };
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Route Optimization
  async optimizeRoute(routeId, tenantId) {
    try {
      const route = await TransportRoute.findOne({ _id: routeId, tenant: tenantId });

      if (!route) {
        throw new Error('Route not found');
      }

      if (!route.stops || route.stops.length < 2) {
        throw new Error('Route must have at least 2 stops to optimize');
      }

      // Simple nearest neighbor algorithm
      // In production, use Google Maps Directions API or similar
      const optimizedStops = this.nearestNeighborOptimization(route.stops);

      // Calculate total distance
      let totalDistance = 0;
      for (let i = 0; i < optimizedStops.length - 1; i++) {
        const distance = this.calculateDistance(
          optimizedStops[i].latitude,
          optimizedStops[i].longitude,
          optimizedStops[i + 1].latitude,
          optimizedStops[i + 1].longitude
        );
        totalDistance += distance;
      }

      return {
        originalStops: route.stops,
        optimizedStops,
        totalDistance: totalDistance.toFixed(2),
        estimatedTime: Math.round((totalDistance / 30) * 60), // minutes at 30 km/h
        savings: {
          distance: 0, // Calculate based on original route
          time: 0,
        },
      };
    } catch (error) {
      logger.error(`Error optimizing route: ${error.message}`);
      throw error;
    }
  }

  nearestNeighborOptimization(stops) {
    if (stops.length <= 2) return stops;

    const optimized = [stops[0]]; // Start with first stop
    const remaining = stops.slice(1);

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let minDistance = Infinity;

      remaining.forEach((stop, index) => {
        const distance = this.calculateDistance(
          current.latitude,
          current.longitude,
          stop.latitude,
          stop.longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = index;
        }
      });

      optimized.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return optimized;
  }

  async applyOptimizedRoute(routeId, tenantId, optimizedStops) {
    try {
      const route = await TransportRoute.findOneAndUpdate(
        { _id: routeId, tenant: tenantId },
        { $set: { stops: optimizedStops } },
        { new: true, runValidators: true }
      );

      if (!route) {
        throw new Error('Route not found');
      }

      logger.info(`Route optimized: ${route.routeName}`);
      return route;
    } catch (error) {
      logger.error(`Error applying optimized route: ${error.message}`);
      throw error;
    }
  }

  // Fuel Management
  async recordFuelEntry(fuelData, tenantId) {
    try {
      const { vehicleId, date, quantity, cost, odometerReading, fuelType, station } = fuelData;

      const vehicle = await Vehicle.findOne({ _id: vehicleId, tenant: tenantId });

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      const fuelEntry = {
        date: new Date(date),
        quantity,
        cost,
        odometerReading,
        fuelType: fuelType || 'Diesel',
        station,
        pricePerLiter: cost / quantity,
      };

      vehicle.fuelHistory = vehicle.fuelHistory || [];
      vehicle.fuelHistory.push(fuelEntry);

      // Update total fuel consumption
      vehicle.totalFuelConsumed = (vehicle.totalFuelConsumed || 0) + quantity;

      await vehicle.save();

      logger.info(`Fuel entry recorded for vehicle: ${vehicle.vehicleNumber}`);
      return fuelEntry;
    } catch (error) {
      logger.error(`Error recording fuel entry: ${error.message}`);
      throw error;
    }
  }

  async getFuelHistory(vehicleId, tenantId, filters = {}) {
    try {
      const { startDate, endDate, page = 1, limit = 20 } = filters;

      const vehicle = await Vehicle.findOne({ _id: vehicleId, tenant: tenantId });

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      let fuelHistory = vehicle.fuelHistory || [];

      // Filter by date range
      if (startDate || endDate) {
        fuelHistory = fuelHistory.filter(entry => {
          const entryDate = new Date(entry.date);
          if (startDate && entryDate < new Date(startDate)) return false;
          if (endDate && entryDate > new Date(endDate)) return false;
          return true;
        });
      }

      // Sort by date descending
      fuelHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Pagination
      const total = fuelHistory.length;
      const skip = (page - 1) * limit;
      const paginatedHistory = fuelHistory.slice(skip, skip + limit);

      return {
        vehicle: {
          id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          vehicleType: vehicle.vehicleType,
        },
        fuelHistory: paginatedHistory,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching fuel history: ${error.message}`);
      throw error;
    }
  }

  async getFuelAnalytics(vehicleId, tenantId, period = 'month') {
    try {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, tenant: tenantId });

      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      const fuelHistory = vehicle.fuelHistory || [];

      if (fuelHistory.length === 0) {
        return {
          message: 'No fuel data available',
          analytics: null,
        };
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate;
      switch (period) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(0); // All time
      }

      const filteredHistory = fuelHistory.filter(
        entry => new Date(entry.date) >= startDate
      );

      if (filteredHistory.length === 0) {
        return {
          message: `No fuel data available for the selected period: ${period}`,
          analytics: null,
        };
      }

      // Calculate analytics
      const totalQuantity = filteredHistory.reduce((sum, entry) => sum + entry.quantity, 0);
      const totalCost = filteredHistory.reduce((sum, entry) => sum + entry.cost, 0);
      const avgPricePerLiter = totalCost / totalQuantity;

      // Calculate mileage if odometer readings are available
      const sortedByOdometer = filteredHistory
        .filter(entry => entry.odometerReading)
        .sort((a, b) => a.odometerReading - b.odometerReading);

      let mileage = null;
      if (sortedByOdometer.length >= 2) {
        const totalDistance =
          sortedByOdometer[sortedByOdometer.length - 1].odometerReading -
          sortedByOdometer[0].odometerReading;
        mileage = totalDistance / totalQuantity; // km per liter
      }

      return {
        vehicle: {
          id: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          vehicleType: vehicle.vehicleType,
        },
        period,
        analytics: {
          totalEntries: filteredHistory.length,
          totalQuantity: totalQuantity.toFixed(2),
          totalCost: totalCost.toFixed(2),
          avgPricePerLiter: avgPricePerLiter.toFixed(2),
          mileage: mileage ? mileage.toFixed(2) : 'N/A',
          avgCostPerEntry: (totalCost / filteredHistory.length).toFixed(2),
        },
      };
    } catch (error) {
      logger.error(`Error fetching fuel analytics: ${error.message}`);
      throw error;
    }
  }

  async getFuelSummary(tenantId, filters = {}) {
    try {
      const { startDate, endDate } = filters;
      const query = { tenant: tenantId };

      const vehicles = await Vehicle.find(query);

      let totalFuel = 0;
      let totalCost = 0;
      let vehicleCount = 0;

      vehicles.forEach(vehicle => {
        if (vehicle.fuelHistory && vehicle.fuelHistory.length > 0) {
          let vehicleFuel = vehicle.fuelHistory;

          // Filter by date range
          if (startDate || endDate) {
            vehicleFuel = vehicleFuel.filter(entry => {
              const entryDate = new Date(entry.date);
              if (startDate && entryDate < new Date(startDate)) return false;
              if (endDate && entryDate > new Date(endDate)) return false;
              return true;
            });
          }

          if (vehicleFuel.length > 0) {
            vehicleCount++;
            totalFuel += vehicleFuel.reduce((sum, entry) => sum + entry.quantity, 0);
            totalCost += vehicleFuel.reduce((sum, entry) => sum + entry.cost, 0);
          }
        }
      });

      return {
        totalVehicles: vehicles.length,
        vehiclesWithFuelData: vehicleCount,
        totalFuelConsumed: totalFuel.toFixed(2),
        totalFuelCost: totalCost.toFixed(2),
        avgCostPerVehicle: vehicleCount > 0 ? (totalCost / vehicleCount).toFixed(2) : 0,
        avgFuelPerVehicle: vehicleCount > 0 ? (totalFuel / vehicleCount).toFixed(2) : 0,
      };
    } catch (error) {
      logger.error(`Error fetching fuel summary: ${error.message}`);
      throw error;
    }
  }
}

export default new TransportService();
