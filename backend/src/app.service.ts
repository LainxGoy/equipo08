import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(
        `ALTER TABLE ventas DROP CONSTRAINT IF EXISTS "UQ_2e4b67befc0095f3e9d02d54da4"`
      );
      console.log('Successfully dropped old constraint UQ_2e4b67befc0095f3e9d02d54da4 from ventas table');
    } catch (e) {
      console.error('Failed to drop constraint on startup:', e);
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}

