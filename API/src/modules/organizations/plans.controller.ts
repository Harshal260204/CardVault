import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrganizationsService } from './organizations.service';

@Controller('admin/plans')
@Roles(UserRole.platform_super_admin)
export class PlansController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  async list() {
    const items = await this.organizations.listPlans();
    return { data: items };
  }
}
