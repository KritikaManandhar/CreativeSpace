import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      displayName: string;
      isAdmin: boolean;
      avatarUrl?: string | null;
      disciplines?: string[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    username: string;
    displayName: string;
    isAdmin: boolean;
    avatarUrl?: string | null;
    disciplines?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    displayName: string;
    isAdmin: boolean;
    avatarUrl?: string | null;
    disciplines?: string[];
  }
}
