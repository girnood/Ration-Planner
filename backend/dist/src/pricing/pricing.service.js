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
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pricing_constants_1 = require("./pricing.constants");
let PricingService = class PricingService {
    configService;
    baseFare;
    perKmRate;
    minimumFare;
    constructor(configService) {
        this.configService = configService;
        this.baseFare = this.getNumericEnv('PRICING_BASE_FARE', pricing_constants_1.PRICING_DEFAULTS.baseFare);
        this.perKmRate = this.getNumericEnv('PRICING_PER_KM_RATE', pricing_constants_1.PRICING_DEFAULTS.perKmRate);
        this.minimumFare = this.getNumericEnv('PRICING_MIN_FARE', pricing_constants_1.PRICING_DEFAULTS.minimumFare);
    }
    calculateFare(distanceKm) {
        const normalizedDistance = Math.max(0, distanceKm);
        const subtotal = this.baseFare + normalizedDistance * this.perKmRate;
        const total = Math.max(subtotal, this.minimumFare);
        return {
            base: this.baseFare,
            distanceKm: normalizedDistance,
            perKmRate: this.perKmRate,
            subtotal,
            total,
        };
    }
    getNumericEnv(key, fallback) {
        const value = this.configService.get(key);
        if (!value) {
            return fallback;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PricingService);
//# sourceMappingURL=pricing.service.js.map