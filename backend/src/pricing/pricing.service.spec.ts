import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => {
              const config = {
                BASE_FARE: '5.0',
                RATE_PER_KM: '0.35',
                MINIMUM_FARE: '5.0',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePrice', () => {
    it('should calculate price correctly for 10 km', () => {
      // Base: 5.000 + (10 × 0.350) = 5.000 + 3.500 = 8.500 OMR
      const price = service.calculatePrice(10);
      expect(price).toBe(8.5);
    });

    it('should calculate price correctly for 20 km', () => {
      // Base: 5.000 + (20 × 0.350) = 5.000 + 7.000 = 12.000 OMR
      const price = service.calculatePrice(20);
      expect(price).toBe(12.0);
    });

    it('should return minimum fare for 0 km', () => {
      // Should return minimum fare (5.000 OMR)
      const price = service.calculatePrice(0);
      expect(price).toBe(5.0);
    });

    it('should return minimum fare for very short distance', () => {
      // Base: 5.000 + (0.5 × 0.350) = 5.000 + 0.175 = 5.175 OMR
      const price = service.calculatePrice(0.5);
      expect(price).toBe(5.175);
    });

    it('should handle large distances', () => {
      // Base: 5.000 + (100 × 0.350) = 5.000 + 35.000 = 40.000 OMR
      const price = service.calculatePrice(100);
      expect(price).toBe(40.0);
    });

    it('should round to 3 decimal places', () => {
      // Test rounding
      const price = service.calculatePrice(1.2345);
      expect(price).toBeCloseTo(5.432, 3);
    });
  });

  describe('getPricingBreakdown', () => {
    it('should return correct breakdown for 15 km', () => {
      const breakdown = service.getPricingBreakdown(15);

      expect(breakdown.baseFare).toBe(5.0);
      expect(breakdown.ratePerKm).toBe(0.35);
      expect(breakdown.distance).toBe(15);
      expect(breakdown.distanceCost).toBe(5.25);
      expect(breakdown.subtotal).toBe(10.25);
      expect(breakdown.totalPrice).toBe(10.25);
    });
  });

  describe('formatPrice', () => {
    it('should format price with OMR currency', () => {
      const formatted = service.formatPrice(12.5);
      expect(formatted).toBe('12.500 OMR');
    });

    it('should format price with 3 decimal places', () => {
      const formatted = service.formatPrice(5);
      expect(formatted).toBe('5.000 OMR');
    });
  });

  describe('getters', () => {
    it('should return correct base fare', () => {
      expect(service.getBaseFare()).toBe(5.0);
    });

    it('should return correct rate per km', () => {
      expect(service.getRatePerKm()).toBe(0.35);
    });

    it('should return correct minimum fare', () => {
      expect(service.getMinimumFare()).toBe(5.0);
    });
  });
});
