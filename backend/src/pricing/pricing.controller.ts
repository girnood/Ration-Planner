import { Controller, Get } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  /**
   * Get pricing constants (for frontend display)
   */
  @Get('constants')
  getConstants() {
    return this.pricingService.getPricingConstants();
  }
}
