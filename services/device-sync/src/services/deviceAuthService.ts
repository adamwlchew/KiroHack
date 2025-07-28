import jwt from 'jsonwebtoken';
import { DeviceAuthToken } from '@pageflow/types';
import { config } from '../config';
import { AppError } from '@pageflow/utils';
import { v4 as uuidv4 } from 'uuid';

export class DeviceAuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = config.jwt.secret;
    this.jwtExpiresIn = config.jwt.expiresIn;
  }

  generateDeviceToken(deviceId: string, userId: string): DeviceAuthToken {
    const tokenId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.parseExpirationTime(this.jwtExpiresIn));

    const payload = {
      jti: tokenId,
      deviceId,
      userId,
      type: 'device',
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const token = jwt.sign(payload, this.jwtSecret);

    return {
      deviceId,
      userId,
      token,
      expiresAt,
      createdAt: now,
    };
  }

  verifyDeviceToken(token: string): { deviceId: string; userId: string; tokenId: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      if (decoded.type !== 'device') {
        throw new AppError('Invalid token type', 401);
      }

      return {
        deviceId: decoded.deviceId,
        userId: decoded.userId,
        tokenId: decoded.jti,
      };
    } catch (error: any) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid device token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Device token expired', 401);
      }
      throw error;
    }
  }

  refreshDeviceToken(oldToken: string): DeviceAuthToken {
    const decoded = this.verifyDeviceToken(oldToken);
    return this.generateDeviceToken(decoded.deviceId, decoded.userId);
  }

  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new AppError('Invalid expiration time format', 500);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new AppError('Invalid expiration time unit', 500);
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      jwt.verify(token, this.jwtSecret);
      return false;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return true;
      }
      return false; // Other errors don't necessarily mean expired
    }
  }

  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}