"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DispatcherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatcherService = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("../orders/orders.service");
const providers_service_1 = require("../providers/providers.service");
const pricing_service_1 = require("../pricing/pricing.service");
const OFFER_TIMEOUT_MS = 20_000;
let DispatcherService = DispatcherService_1 = class DispatcherService {
    ordersService;
    providersService;
    pricingService;
    logger = new common_1.Logger(DispatcherService_1.name);
    driverQueue = [];
    queuePointer = 0;
    constructor(ordersService, providersService, pricingService) {
        this.ordersService = ordersService;
        this.providersService = providersService;
        this.pricingService = pricingService;
    }
    async handleDriverLocationUpdate(dto) {
        await this.providersService.updateDriverLocation(dto.driverId, dto.lat, dto.lng);
        if (typeof dto.isOnline === 'boolean') {
            await this.providersService.markOnline(dto.driverId, dto.isOnline);
            this.syncQueue(dto.driverId, dto.isOnline);
        }
    }
    async hydrateQueueFromPickup(pickup) {
        const candidates = await this.providersService.findNearestApprovedDrivers(pickup.lat, pickup.lng);
        this.driverQueue.length = 0;
        this.driverQueue.push(...candidates.map((candidate) => candidate.userId));
        this.queuePointer = 0;
        return candidates;
    }
    async estimateFare(distanceKm) {
        return this.pricingService.calculateFare(distanceKm);
    }
    async dispatchOrder(orderId) {
        if (!this.driverQueue.length) {
            this.logger.warn(`No drivers available for order ${orderId}`);
            return null;
        }
        const attempts = this.driverQueue.length;
        for (let i = 0; i < attempts; i += 1) {
            const driverId = this.nextDriver();
            if (!driverId) {
                break;
            }
            this.logger.debug(`Offering order ${orderId} to driver ${driverId} for up to ${OFFER_TIMEOUT_MS}ms`);
        }
        return null;
    }
    syncQueue(driverId, isOnline) {
        const currentIndex = this.driverQueue.indexOf(driverId);
        if (!isOnline && currentIndex >= 0) {
            this.driverQueue.splice(currentIndex, 1);
            this.queuePointer = this.driverQueue.length
                ? this.queuePointer % this.driverQueue.length
                : 0;
            return;
        }
        if (isOnline && currentIndex === -1) {
            this.driverQueue.push(driverId);
        }
    }
    nextDriver() {
        if (!this.driverQueue.length) {
            return null;
        }
        const driverId = this.driverQueue[this.queuePointer];
        this.queuePointer = (this.queuePointer + 1) % this.driverQueue.length;
        return driverId;
    }
    getQueueSnapshot() {
        return [...this.driverQueue];
    }
};
exports.DispatcherService = DispatcherService;
exports.DispatcherService = DispatcherService = DispatcherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        providers_service_1.ProvidersService,
        pricing_service_1.PricingService])
], DispatcherService);
//# sourceMappingURL=dispatcher.service.js.map