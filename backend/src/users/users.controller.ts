import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('leaders')
  async findLeaders() {
    return this.usersService.findLeaders();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(parseInt(id));
  }
}
