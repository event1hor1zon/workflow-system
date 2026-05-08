import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CountiesModule } from './counties/counties.module';
import { DepartmentsModule } from './departments/departments.module';
import { OrdersModule } from './orders/orders.module';
import { User } from './users/entities/user.entity';
import { County } from './counties/entities/county.entity';
import { Department } from './departments/entities/department.entity';
import { Order } from './orders/entities/order.entity';
import { OrderFlow } from './orders/entities/order-flow.entity';
import { OrderApproval } from './orders/entities/order-approval.entity';
import { DataSource } from 'typeorm';
import { SeedService } from './seed.service';

const shouldSynchronize = process.env.DB_SYNCHRONIZE !== 'false';
const shouldLogSql = process.env.DB_LOGGING === 'true' || process.env.NODE_ENV === 'development';
const shouldSeed = process.env.SEED_DATA !== 'false';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'workflow_db',
      entities: [User, County, Department, Order, OrderFlow, OrderApproval],
      synchronize: shouldSynchronize,
      logging: shouldLogSql,
    }),
    AuthModule,
    UsersModule,
    CountiesModule,
    DepartmentsModule,
    OrdersModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    if (!shouldSeed) {
      return;
    }

    // Run seed data when database is initialized
    const seedService = new SeedService(this.dataSource);
    await seedService.seed();
  }
}
