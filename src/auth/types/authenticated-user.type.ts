import { UserRole } from '../../users/enums/user-role.enum.ts';

export type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};