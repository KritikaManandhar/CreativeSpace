import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      displayName: string;
      role: UserRole;
      isAdmin: boolean;
      avatarUrl?: string | null;
      disciplines?: string[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    username: string;
    displayName: string;
    role: UserRole;
    isAdmin: boolean;
    avatarUrl?: string | null;
    disciplines?: string[];
    securityStamp?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    displayName: string;
    role: UserRole;
    isAdmin: boolean;
    avatarUrl?: string | null;
    disciplines?: string[];
    securityStamp?: string;
    sessionInvalid?: boolean;
  }
}
