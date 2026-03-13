import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

export class RedisCacheService {
  private client;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => {
      console.warn('[Redis] Connection error (caching disabled):', err.message);
      this.isConnected = false;
      this.isConnecting = false;
    });
    this.client.on('connect', () => {
      this.isConnected = true;
      this.isConnecting = false;
      console.log('[Redis] Connected successfully');
    });
    this.client.on('end', () => {
      this.isConnected = false;
      this.isConnecting = false;
    });
  }

  private async ensureConnection(): Promise<boolean> {
    if (this.isConnected) return true;
    if (this.isConnecting) return false;

    try {
      this.isConnecting = true;
      await this.client.connect();
      return true;
    } catch (err: any) {
      console.warn('[Redis] Could not connect, caching disabled:', err.message);
      this.isConnecting = false;
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const connected = await this.ensureConnection();
    if (!connected) return null;

    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (err: any) {
      console.warn('[Redis] Get error:', err.message);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 21600): Promise<void> {
    const connected = await this.ensureConnection();
    if (!connected) return;

    try {
      const serializedValue = JSON.stringify(value);
      await this.client.set(key, serializedValue, { EX: ttlSeconds });
    } catch (err: any) {
      console.warn('[Redis] Set error:', err.message);
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 21600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const fresh = await fetcher();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  async clear(pattern: string): Promise<void> {
    const connected = await this.ensureConnection();
    if (!connected) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (err: any) {
      console.warn('[Redis] Clear error:', err.message);
    }
  }
}

export const cacheService = new RedisCacheService();
