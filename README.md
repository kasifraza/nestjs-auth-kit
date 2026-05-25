# @kasifraza/nestjs-auth-kit

[![npm version](https://img.shields.io/npm/v/@kasifraza/nestjs-auth-kit.svg)](https://www.npmjs.com/package/@kasifraza/nestjs-auth-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

JWT + Refresh token + Role-based guards package for NestJS.

## Installation

```bash
npm install @kasifraza/nestjs-auth-kit
```

## Setup

```typescript
import { AuthModule } from '@kasifraza/nestjs-auth-kit';

@Module({
  imports: [
    AuthModule.register({
      secret: 'your-jwt-secret',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
    }),
  ],
})
export class AppModule {}
```

## Usage

### TokenService

```typescript
import { TokenService } from '@kasifraza/nestjs-auth-kit';

@Injectable()
export class AuthService {
  constructor(private tokenService: TokenService) {}

  login(user: any) {
    const accessToken = this.tokenService.generateAccessToken({ sub: user.id, roles: user.roles });
    const refreshToken = this.tokenService.generateRefreshToken({ sub: user.id });
    return { accessToken, refreshToken };
  }
}
```

### Guards & Decorators

```typescript
import { Auth, CurrentUser } from '@kasifraza/nestjs-auth-kit';

@Controller('users')
export class UsersController {
  @Get('profile')
  @Auth('admin', 'user')
  getProfile(@CurrentUser() user: any) {
    return user;
  }
}
```

## API

- `AuthModule.register(options)` - Register module with JWT config
- `TokenService` - Generate/verify/decode tokens
- `JwtAuthGuard` - Validates Bearer JWT tokens
- `RolesGuard` - Checks user roles against required roles
- `@Roles(...roles)` - Set required roles metadata
- `@Auth(...roles)` - Combined guard + roles decorator
- `@CurrentUser()` - Extract user from request

## License

MIT
