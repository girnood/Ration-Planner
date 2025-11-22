import { Injectable, Logger } from '@nestjs/common';

interface DriverState {
  id: string;
  lat: number;
  lng: number;
  heading?: number;
  status?: string;
  updatedAt: Date;
}

@Injectable()
export class RoundRobinService {
  private readonly logger = new Logger(RoundRobinService.name);
  private readonly driverQueue: string[] = [];
  private readonly driverState = new Map<string, DriverState>();
  private currentIndex = 0;

  registerDriver(driverId: string) {
    if (!this.driverQueue.includes(driverId)) {
      this.driverQueue.push(driverId);
      this.logger.debug(`Driver ${driverId} registered for dispatch queue.`);
    }
  }

  removeDriver(driverId: string) {
    const index = this.driverQueue.indexOf(driverId);
    if (index >= 0) {
      this.driverQueue.splice(index, 1);
      this.logger.debug(`Driver ${driverId} removed from dispatch queue.`);
      if (this.currentIndex >= this.driverQueue.length) {
        this.currentIndex = 0;
      }
    }
    this.driverState.delete(driverId);
  }

  updateDriverLocation(driverId: string, lat: number, lng: number, heading?: number, status?: string) {
    this.driverState.set(driverId, {
      id: driverId,
      lat,
      lng,
      heading,
      status,
      updatedAt: new Date(),
    });
  }

  getDriverState(driverId: string): DriverState | undefined {
    return this.driverState.get(driverId);
  }

  /**
   * Round-robin iteration ensures every online driver receives an offer before
   * we loop back to the start. This prevents starving drivers who may not be
   * the absolute closest but are within the service radius.
   */
  getNextDriver(): DriverState | undefined {
    if (!this.driverQueue.length) {
      return undefined;
    }

    const driverId = this.driverQueue[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.driverQueue.length;
    return this.driverState.get(driverId);
  }

  listActiveDrivers(): DriverState[] {
    return this.driverQueue
      .map((driverId) => this.driverState.get(driverId))
      .filter((driver): driver is DriverState => !!driver);
  }
}
