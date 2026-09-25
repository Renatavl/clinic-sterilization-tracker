import { UserRole } from "../../users/enums/user-role.enum.ts";


export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};