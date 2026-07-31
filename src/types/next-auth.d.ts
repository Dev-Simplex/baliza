import type { UserRole } from "@/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string | null;
      role: UserRole;
      isPlatformAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    organizationId?: string | null;
    role?: UserRole;
    isPlatformAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organizationId: string | null;
    role: UserRole;
    isPlatformAdmin: boolean;
  }
}
