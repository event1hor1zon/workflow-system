import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { County } from './entities/county.entity';
import { CountiesService } from './counties.service';
import { CountiesController } from './counties.controller';

@Module({
  imports: [TypeOrmModule.forFeature([County])],
  controllers: [CountiesController],
  providers: [CountiesService],
  exports: [CountiesService],
})
export class CountiesModule {}
