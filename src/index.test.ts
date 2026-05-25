import 'reflect-metadata';
import * as jwt from 'jsonwebtoken';
import { TokenService, JwtAuthGuard, RolesGuard } from './index';

const SECRET = 'test-secret';

describe('TokenService', () => {
  const service = new TokenService({ secret: SECRET, accessTokenExpiry: '1h', refreshTokenExpiry: '7d' });

  it('generates and verifies access token', () => {
    const token = service.generateAccessToken({ sub: '1', roles: ['admin'] });
    const decoded = service.verifyToken(token);
    expect(decoded.sub).toBe('1');
    expect(decoded.roles).toEqual(['admin']);
  });

  it('generates and verifies refresh token', () => {
    const token = service.generateRefreshToken({ sub: '2' });
    const decoded = service.verifyToken(token);
    expect(decoded.sub).toBe('2');
  });

  it('decodeToken works without verification', () => {
    const token = jwt.sign({ sub: '3' }, 'other-secret');
    const decoded = service.decodeToken(token);
    expect(decoded.sub).toBe('3');
  });

  it('verifyToken throws on invalid token', () => {
    expect(() => service.verifyToken('invalid')).toThrow();
  });
});

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard({ secret: SECRET });

  const mockContext = (authHeader?: string) => ({
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization: authHeader }, user: null }),
    }),
  } as any);

  it('returns true for valid Bearer token', () => {
    const token = jwt.sign({ sub: '1' }, SECRET);
    expect(guard.canActivate(mockContext(`Bearer ${token}`))).toBe(true);
  });

  it('returns false for missing header', () => {
    expect(guard.canActivate(mockContext(undefined))).toBe(false);
  });

  it('returns false for invalid token', () => {
    expect(guard.canActivate(mockContext('Bearer invalid'))).toBe(false);
  });
});

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as any;
  const guard = new RolesGuard(reflector);

  const mockContext = (user: any) => ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any);

  it('allows when no roles required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext({}))).toBe(true);
  });

  it('allows when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    expect(guard.canActivate(mockContext({ roles: ['admin', 'user'] }))).toBe(true);
  });

  it('denies when user lacks required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    expect(guard.canActivate(mockContext({ roles: ['user'] }))).toBe(false);
  });
});
