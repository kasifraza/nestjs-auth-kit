import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Module,
  SetMetadata,
  DynamicModule,
  Inject,
  applyDecorators,
  UseGuards,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

export interface AuthModuleOptions {
  secret: string;
  accessTokenExpiry?: string | number;
  refreshTokenExpiry?: string | number;
}

const AUTH_OPTIONS = 'AUTH_OPTIONS';
const ROLES_KEY = 'roles';

@Injectable()
export class TokenService {
  constructor(@Inject(AUTH_OPTIONS) private options: AuthModuleOptions) {}

  generateAccessToken(payload: object): string {
    return jwt.sign(payload, this.options.secret, {
      expiresIn: (this.options.accessTokenExpiry || '15m') as any,
    });
  }

  generateRefreshToken(payload: object): string {
    return jwt.sign(payload, this.options.secret, {
      expiresIn: (this.options.refreshTokenExpiry || '7d') as any,
    });
  }

  verifyToken(token: string): any {
    return jwt.verify(token, this.options.secret);
  }

  decodeToken(token: string): any {
    return jwt.decode(token);
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AUTH_OPTIONS) private options: AuthModuleOptions) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) return false;
    try {
      req.user = jwt.verify(auth.slice(7), this.options.secret);
      return true;
    } catch {
      return false;
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    return user?.roles?.some((r: string) => roles.includes(r)) ?? false;
  }
}

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const Auth = (...roles: string[]) =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles(...roles));

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);

@Module({})
export class AuthModule {
  static register(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        { provide: AUTH_OPTIONS, useValue: options },
        TokenService,
        JwtAuthGuard,
        RolesGuard,
      ],
      exports: [TokenService, JwtAuthGuard, RolesGuard, AUTH_OPTIONS],
      global: true,
    };
  }
}
