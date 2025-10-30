import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(__dirname, '../../data');

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  pin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  deviceId: string;
  status: 'captured' | 'delivered' | 'collected';
  photoUrl: string | null;
  thumbUrl: string | null;
  tsDetected: string;
  tsPhoto?: string | null;
  tsDelivered: string | null;
  tsCollected: string | null;
  tsRelease?: string | null;
  tsDrop?: string | null;
  distanceCm?: number | null;
  recipientName: string | null;
  recipientPhone: string | null;
  note?: string | null;
  waNotified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  name: string;
  mqttTopic: string;
  status: 'online' | 'offline';
  lastSeen: string | null;
  fwVersion?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  type: string;
  deviceId: string | null;
  packageId: string | null;
  data: any;
  ts: string;
  details?: any;
  createdAt: string;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
  updatedAt: string;
}

class JsonDatabase {
  private async readFile<T>(filename: string): Promise<T> {
    try {
      const filePath = path.join(DATA_DIR, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      throw error;
    }
  }

  private async writeFile<T>(filename: string, data: T): Promise<void> {
    try {
      const filePath = path.join(DATA_DIR, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      throw error;
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    const data = await this.readFile<{ users: User[] }>('users.json');
    return data.users;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.username === username) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  async createUser(username: string, password: string, role: 'admin' | 'user' = 'user'): Promise<User> {
    const users = await this.getUsers();
    
    // Check if username exists
    if (users.find(u => u.username === username)) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      password: hashedPassword,
      role,
      pin: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    await this.writeFile('users.json', { users });
    
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.writeFile('users.json', { users });
    return users[index];
  }

  async deleteUser(id: string): Promise<boolean> {
    const users = await this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    
    if (filtered.length === users.length) return false;
    
    await this.writeFile('users.json', { users: filtered });
    return true;
  }

  async updateUserPin(id: string, pin: string | null): Promise<User | null> {
    return this.updateUser(id, { pin });
  }

  async updateUserPassword(id: string, password: string): Promise<User | null> {
    return this.updateUser(id, { password });
  }

  // Packages
  async getPackages(): Promise<Package[]> {
    const data = await this.readFile<{ packages: Package[] }>('packages.json');
    return data.packages;
  }

  async getPackageById(id: string): Promise<Package | null> {
    const packages = await this.getPackages();
    return packages.find(p => p.id === id) || null;
  }

  async createPackage(packageData: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>): Promise<Package> {
    const packages = await this.getPackages();
    
    const newPackage: Package = {
      ...packageData,
      id: `pkg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    packages.push(newPackage);
    await this.writeFile('packages.json', { packages });
    
    return newPackage;
  }

  async updatePackage(id: string, updates: Partial<Package>): Promise<Package | null> {
    const packages = await this.getPackages();
    const index = packages.findIndex(p => p.id === id);
    
    if (index === -1) return null;

    packages[index] = {
      ...packages[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.writeFile('packages.json', { packages });
    return packages[index];
  }

  async deletePackage(id: string): Promise<boolean> {
    const packages = await this.getPackages();
    const filtered = packages.filter(p => p.id !== id);
    
    if (filtered.length === packages.length) return false;
    
    await this.writeFile('packages.json', { packages: filtered });
    return true;
  }

  // Devices
  async getDevices(): Promise<Device[]> {
    const data = await this.readFile<{ devices: Device[] }>('devices.json');
    return data.devices;
  }

  async getDeviceById(id: string): Promise<Device | null> {
    const devices = await this.getDevices();
    return devices.find(d => d.id === id) || null;
  }

  async createDevice(deviceData: Omit<Device, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Device> {
    const devices = await this.getDevices();
    
    const newDevice: Device = {
      ...deviceData,
      id: deviceData.id || `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    devices.push(newDevice);
    await this.writeFile('devices.json', { devices });
    
    return newDevice;
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | null> {
    const devices = await this.getDevices();
    const index = devices.findIndex(d => d.id === id);
    
    if (index === -1) return null;

    devices[index] = {
      ...devices[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.writeFile('devices.json', { devices });
    return devices[index];
  }

  async deleteDevice(id: string): Promise<boolean> {
    const devices = await this.getDevices();
    const filtered = devices.filter(d => d.id !== id);
    
    if (filtered.length === devices.length) return false;
    
    await this.writeFile('devices.json', { devices: filtered });
    return true;
  }

  // Events
  async getEvents(): Promise<Event[]> {
    const data = await this.readFile<{ events: Event[] }>('events.json');
    return data.events;
  }

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    const events = await this.getEvents();
    
    const newEvent: Event = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ts: eventData.ts || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    events.push(newEvent);
    
    // Keep only last 1000 events
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }
    
    await this.writeFile('events.json', { events });
    
    return newEvent;
  }

  // Push Subscriptions
  async getPushSubscriptions(): Promise<PushSubscription[]> {
    const data = await this.readFile<{ pushSubscriptions: PushSubscription[] }>('pushSubscriptions.json');
    return data.pushSubscriptions;
  }

  async getPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    const subscriptions = await this.getPushSubscriptions();
    return subscriptions.find(s => s.endpoint === endpoint) || null;
  }

  async getPushSubscriptionsByUserId(userId: string): Promise<PushSubscription[]> {
    const subscriptions = await this.getPushSubscriptions();
    return subscriptions.filter(s => s.userId === userId);
  }

  async createPushSubscription(subscriptionData: Omit<PushSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<PushSubscription> {
    const subscriptions = await this.getPushSubscriptions();
    
    const newSubscription: PushSubscription = {
      ...subscriptionData,
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    subscriptions.push(newSubscription);
    await this.writeFile('pushSubscriptions.json', { pushSubscriptions: subscriptions });
    
    return newSubscription;
  }

  async updatePushSubscription(endpoint: string, updates: Partial<Omit<PushSubscription, 'id' | 'endpoint' | 'createdAt'>>): Promise<PushSubscription | null> {
    const subscriptions = await this.getPushSubscriptions();
    const index = subscriptions.findIndex(s => s.endpoint === endpoint);
    
    if (index === -1) return null;
    
    subscriptions[index] = {
      ...subscriptions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await this.writeFile('pushSubscriptions.json', { pushSubscriptions: subscriptions });
    return subscriptions[index];
  }

  async deletePushSubscription(endpoint: string): Promise<boolean> {
    const subscriptions = await this.getPushSubscriptions();
    const filtered = subscriptions.filter(s => s.endpoint !== endpoint);
    
    if (filtered.length === subscriptions.length) return false;
    
    await this.writeFile('pushSubscriptions.json', { pushSubscriptions: filtered });
    return true;
  }

  async deletePushSubscriptionsByUserId(userId: string): Promise<number> {
    const subscriptions = await this.getPushSubscriptions();
    const filtered = subscriptions.filter(s => s.userId !== userId);
    const deletedCount = subscriptions.length - filtered.length;
    
    if (deletedCount > 0) {
      await this.writeFile('pushSubscriptions.json', { pushSubscriptions: filtered });
    }
    
    return deletedCount;
  }
}

export const db = new JsonDatabase();

// Initialize admin user on startup
export async function initializeDatabase() {
  try {
    const users = await db.getUsers();
    
    if (users.length === 0) {
      console.log('🔧 Creating default admin user...');
      await db.createUser('admin', 'admin123', 'admin');
      console.log('✅ Default admin created - Username: admin, Password: admin123');
      console.log('⚠️  PLEASE CHANGE THE DEFAULT PASSWORD IMMEDIATELY!');
    } else {
      console.log(`✅ Database initialized - ${users.length} user(s) found`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}
