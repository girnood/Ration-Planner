"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const pricing_service_1 = require("./pricing.service");
describe('PricingService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [pricing_service_1.PricingService],
        }).compile();
        service = module.get(pricing_service_1.PricingService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should calculate minimum fare', () => {
        expect(service.calculatePrice(0)).toBe(5.000);
    });
    it('should calculate price for 10km', () => {
        expect(service.calculatePrice(10)).toBe(8.500);
    });
    it('should calculate price for 100km', () => {
        expect(service.calculatePrice(100)).toBe(40.000);
    });
});
//# sourceMappingURL=pricing.service.spec.js.map