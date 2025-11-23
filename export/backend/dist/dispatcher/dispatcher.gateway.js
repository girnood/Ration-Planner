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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatcherGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let DispatcherGateway = class DispatcherGateway {
    constructor() {
        this.activeDrivers = new Map();
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        for (const [driverId, data] of this.activeDrivers.entries()) {
            if (data.socketId === client.id) {
                this.activeDrivers.delete(driverId);
                break;
            }
        }
    }
    handleLocationUpdate(data, client) {
        this.activeDrivers.set(data.driverId, {
            socketId: client.id,
            lat: data.lat,
            lng: data.lng,
        });
    }
    handleTowRequest(data) {
        console.log('Tow requested', data);
        this.dispatchJob(data);
    }
    async dispatchJob(request) {
        console.log(`Dispatching job for customer ${request.customerId} at ${request.lat}, ${request.lng}`);
        setTimeout(() => {
            const mockDriverId = "driver-abc-123";
            console.log(`Driver found: ${mockDriverId}. Notifying customer...`);
            this.server.emit('driverFound', {
                customerId: request.customerId,
                driverId: mockDriverId,
                driverName: "Ahmed Al-Balushi",
                etaMinutes: 15,
                vehiclePlate: "9876 AB"
            });
        }, 3000);
    }
};
exports.DispatcherGateway = DispatcherGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], DispatcherGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('updateLocation'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], DispatcherGateway.prototype, "handleLocationUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('requestTow'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DispatcherGateway.prototype, "handleTowRequest", null);
exports.DispatcherGateway = DispatcherGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    (0, common_1.Injectable)()
], DispatcherGateway);
//# sourceMappingURL=dispatcher.gateway.js.map