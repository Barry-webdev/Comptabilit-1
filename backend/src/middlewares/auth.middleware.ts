import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  utilisateur?: {
    id: string;
    identifiant: string;
    role: string;
  };
}

export function authentifier(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token manquant ou invalide' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      identifiant: string;
      role: string;
    };
    req.utilisateur = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token expiré ou invalide' });
  }
}

export function exigerRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.utilisateur || !roles.includes(req.utilisateur.role)) {
      res.status(403).json({ message: 'Accès refusé — permissions insuffisantes' });
      return;
    }
    next();
  };
}
