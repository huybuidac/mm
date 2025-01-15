import { Module } from '@nestjs/common'

import { AuthModule } from '@app/auth/auth.module'
import { CoreModule } from '@app/core/core.module'

@Module({
  imports: [CoreModule, AuthModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
