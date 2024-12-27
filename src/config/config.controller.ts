import { Controller, Get, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get('maps-key')
  getMapsKey() {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }
    return { apiKey };
  }
}