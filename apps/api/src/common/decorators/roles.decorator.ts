import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/auth.constants.js';

export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
