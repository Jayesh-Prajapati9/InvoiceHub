import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

type Role = 'ADMIN' | 'STAFF';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};

