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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pricing_service_1 = require("../pricing/pricing.service");
const dispatcher_gateway_1 = require("../dispatcher/dispatcher.gateway");
let OrdersService = class OrdersService {
    constructor(pricingService, dispatcherGateway) {
        this.pricingService = pricingService;
        this.dispatcherGateway = dispatcherGateway;
        this.prisma = new client_1.PrismaClient();
    }
    async createOrder(data) {
        const distanceKm = this.calculateDistance(data.pickupLat, data.pickupLng, data.dropoffLat, data.dropoffLng);
        const price = this.pricingService.calculatePrice(distanceKm);
        const order = await this.prisma.order.create({
            data: {
                customerId: data.customerId,
                pickup_lat: data.pickupLat,
                pickup_lng: data.pickupLng,
                dropoff_lat: data.dropoffLat,
                dropoff_lng: data.dropoffLng,
                price_estimated: price,
                status: client_1.OrderStatus.SEARCHING,
            },
        });
        return order;
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
    }
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pricing_service_1.PricingService,
        dispatcher_gateway_1.DispatcherGateway])
], OrdersService);
//# sourceMappingURL=orders.service.js.map