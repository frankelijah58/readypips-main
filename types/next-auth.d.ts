import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      subscriptionStatus: string;
      subscriptionType: string;
      subscriptionEndDate?: Date | string;
      subscriptionStartDate?: Date | string;
      freeTrialEndDate?: Date | string;
      emailVerified?: boolean;
      createdAt?: Date | string;
    } & DefaultSession["user"];
    appToken: string;
  }

  interface User extends DefaultUser {
    firstName?: string;
    lastName?: string;
    subscriptionStatus?: string;
    subscriptionType?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: string;
    firstName: string;
    lastName: string;
    subscriptionStatus: string;
    subscriptionType: string;
    subscriptionEndDate?: Date | string;
    subscriptionStartDate?: Date | string;
    freeTrialEndDate?: Date | string;
    emailVerified?: boolean;
    createdAt?: Date | string;
    appToken: string;
  }
}
