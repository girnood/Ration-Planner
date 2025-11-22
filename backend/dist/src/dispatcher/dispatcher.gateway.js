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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DispatcherGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatcherGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const dispatcher_service_1 = require("./dispatcher.service");
const location_update_dto_1 = require("./dto/location-update.dto");
let DispatcherGateway = DispatcherGateway_1 = class DispatcherGateway {
    dispatcherService;
    logger = new common_1.Logger(DispatcherGateway_1.name);
    server;
    constructor(dispatcherService) {
        this.dispatcherService = dispatcherService;
    }
    handleConnection(socket) {
        this.logger.verbose(`Client connected to dispatcher: ${socket.id}`);
    }
    handleDisconnect(socket) {
        this.logger.verbose(`Client disconnected from dispatcher: ${socket.id}`);
    }
    async handleDriverLocationUpdate(payload) {
        await this.dispatcherService.handleDriverLocationUpdate(payload);
        this.server.emit('driverLocationUpdated', {
            driverId: payload.driverId,
            lat: payload.lat,
            lng: payload.lng,
            isOnline: payload.isOnline ?? undefined,
        });
        return { ok: true };
    }
    async handleDispatchOrder(body) {
        await this.dispatcherService.dispatchOrder(body.orderId);
    }
};
exports.DispatcherGateway = DispatcherGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], DispatcherGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    (0, websockets_1.SubscribeMessage)('driverLocationUpdate'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [location_update_dto_1.LocationUpdateDto]),
    __metadata("design:returntype", Promise)
], DispatcherGateway.prototype, "handleDriverLocationUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('dispatchOrder'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DispatcherGateway.prototype, "handleDispatchOrder", null);
exports.DispatcherGateway = DispatcherGateway = DispatcherGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: 'dispatcher',
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [dispatcher_service_1.DispatcherService])
], DispatcherGateway);
//# sourceMappingURL=dispatcher.gateway.js.map