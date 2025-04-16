import { setStorage } from './storage';
import { DbStorage } from './dbStorage';

// Initialize the storage with a database implementation
export function initializeStorage() {
  const dbStorage = new DbStorage();
  setStorage(dbStorage);
  return dbStorage;
}