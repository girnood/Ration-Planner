import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Munkith Roadside Assistance API - Welcome!';
  }
}
