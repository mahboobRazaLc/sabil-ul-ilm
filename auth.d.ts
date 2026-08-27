import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      role: "ADMIN" | "EDITOR" | "STUDENT";
      classId?: string | null;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "EDITOR" | "STUDENT";
    classId?: string | null;
  }
}
declare module "@auth/core/types" {
  interface User {
    role: "ADMIN" | "EDITOR" | "STUDENT";
    classId?: string | null;
  }
}
declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: "ADMIN" | "EDITOR" | "STUDENT";
    classId?: string | null;
  }
}

