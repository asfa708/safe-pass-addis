import { createContext, useContext, useState, useCallback } from 'react';
import {
  initialDrivers,
  initialClients,
  initialRides,
  initialMaintenance,
  initialVehicles,
} from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [clients, setClients] = useState(initialClients);
  const [rides, setRides] = useState(initialRides);
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [vehicles, setVehicles] = useState(initialVehicles);

  // Auth
  const login = useCallback((user) => setCurrentUser(user), []);
  const logout = useCallback(() => setCurrentUser(null), []);

  // Rides
  const addRide = useCallback((ride) => {
    const id = 'r' + (1000 + rides.length + 1);
    setRides(prev => [{ ...ride, id, createdAt: new Date().toISOString() }, ...prev]);
  }, [rides.length]);

  const updateRide = useCallback((id, updates) => {
    setRides(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteRide = useCallback((id) => {
    setRides(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRideStatus = useCallback((id, status) => {
    setRides(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, []);

  // Drivers
  const addDriver = useCallback((driver) => {
    const id = 'd' + Date.now();
    const maxEmpNum = drivers.reduce((max, d) => Math.max(max, d.employeeNumber || 1000), 1000);
    const employeeNumber = maxEmpNum + 1;
    setDrivers(prev => [...prev, { ...driver, id, employeeNumber, totalRides: 0, rating: 5.0, joinDate: new Date().toISOString().split('T')[0] }]);
  }, [drivers]);

  const updateDriver = useCallback((id, updates) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const deleteDriver = useCallback((id) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
  }, []);

  // Clients
  const addClient = useCallback((client) => {
    const id = 'c' + (clients.length + 1 + Date.now());
    setClients(prev => [...prev, { ...client, id, totalSpent: 0, joinDate: new Date().toISOString().split('T')[0] }]);
  }, [clients.length]);

  const updateClient = useCallback((id, updates) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteClient = useCallback((id) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  // Maintenance
  const updateMaintenance = useCallback((id, updates) => {
    setMaintenance(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const addMaintenance = useCallback((record) => {
    const id = 'm' + (maintenance.length + 1 + Date.now());
    setMaintenance(prev => [...prev, { ...record, id }]);
  }, [maintenance.length]);

  // Vehicles
  const addVehicle = useCallback((vehicle) => {
    const id = 'v' + (vehicles.length + 1 + Date.now());
    setVehicles(prev => [...prev, { ...vehicle, id, mileage: vehicle.mileage || 0 }]);
  }, [vehicles.length]);

  const updateVehicle = useCallback((id, updates) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  }, []);

  const deleteVehicle = useCallback((id) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  // Derived helpers
  const getDriver = useCallback((id) => drivers.find(d => d.id === id), [drivers]);
  const getClient = useCallback((id) => clients.find(c => c.id === id), [clients]);

  const stats = {
    totalRides: rides.length,
    activeRides: rides.filter(r => ['onway', 'confirmed', 'arrived'].includes(r.status)).length,
    completedRides: rides.filter(r => r.status === 'completed').length,
    totalRevenue: rides.filter(r => r.status === 'completed').reduce((s, r) => s + (r.priceToClient || 0), 0),
    totalProfit: rides.filter(r => r.status === 'completed').reduce((s, r) => s + ((r.priceToClient || 0) - (r.driverPayout || 0)), 0),
    activeDrivers: drivers.filter(d => d.status === 'Active').length,
    pendingRides: rides.filter(r => r.status === 'new').length,
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      drivers, addDriver, updateDriver, deleteDriver,
      clients, addClient, updateClient, deleteClient,
      rides, addRide, updateRide, deleteRide, updateRideStatus,
      maintenance, updateMaintenance, addMaintenance,
      vehicles, addVehicle, updateVehicle, deleteVehicle,
      getDriver, getClient,
      stats,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
