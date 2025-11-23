import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingService],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate minimum fare', () => {
    // 1 km * 0.350 + 5.0 = 5.350 (Wait, logic says if < 5.0 set to 5.0. 5.35 > 5.0)
    // Let's test 0 km. 5.0 + 0 = 5.0.
    expect(service.calculatePrice(0)).toBe(5.000);
  });

  it('should calculate price for 10km', () => {
    // 5.0 + (10 * 0.350) = 8.5
    expect(service.calculatePrice(10)).toBe(8.500);
  });

  it('should calculate price for 100km', () => {
    // 5.0 + (100 * 0.350) = 40.0
    expect(service.calculatePrice(100)).toBe(40.000);
  });
});
