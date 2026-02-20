import { Role } from './enums';

export interface JwtPayload {
  sub: string;        // userId
  email: string;
  role: Role;
  schoolId: string | null; // null for SUPER_ADMIN
  iat?: number;
  exp?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface AuditLogEntry {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
}

export interface SmsMessage {
  to: string;
  message: string;
  schoolId: string;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
