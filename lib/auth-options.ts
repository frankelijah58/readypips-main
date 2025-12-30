import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getDatabase } from "./mongodb";
import { generateToken } from "./auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  useSecureCookies: false,
  debug: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('[Google OAuth] Attempting to sign in user:', user.email);
        const db = await getDatabase();
        console.log('[Google OAuth] Database connection successful');
        
        // Check if user exists
        let existingUser = await db.collection("users").findOne({ 
          email: user.email 
        });
        console.log('[Google OAuth] Existing user check:', existingUser ? 'Found' : 'Not found');

        if (!existingUser) {
          // Create new user with Google OAuth
          const googleProfile = profile as any;
          
          // Set free trial end date to 3 days from now
          const freeTrialEndDate = new Date();
          freeTrialEndDate.setDate(freeTrialEndDate.getDate() + 3);
          
          const newUser = {
            email: user.email!,
            firstName: googleProfile?.given_name || user.name?.split(' ')[0] || 'User',
            lastName: googleProfile?.family_name || user.name?.split(' ').slice(1).join(' ') || '',
            emailVerified: true,
            emailVerifiedAt: new Date(),
            subscriptionStatus: "active" as const,
            subscriptionType: "free" as const,
            freeTrialEndDate: freeTrialEndDate,
            subscriptionEndDate: null,
            provider: "google",
            googleId: account?.providerAccountId,
            image: user.image,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const result = await db.collection("users").insertOne(newUser);
          console.log('[Google OAuth] New user created with free trial:', { 
            email: user.email, 
            id: result.insertedId,
            freeTrialEndDate: freeTrialEndDate.toISOString()
          });
        } else {
          // Update existing user with Google info if not already linked
          const updateData: any = {
            updatedAt: new Date(),
          };
          
          if (!existingUser.googleId) {
            updateData.googleId = account?.providerAccountId;
            updateData.image = user.image;
            updateData.emailVerified = true;
            updateData.emailVerifiedAt = new Date();
          }
          
          // If user doesn't have a free trial end date, add one
          if (!existingUser.freeTrialEndDate && (!existingUser.subscriptionType || existingUser.subscriptionType === 'free')) {
            const freeTrialEndDate = new Date();
            freeTrialEndDate.setDate(freeTrialEndDate.getDate() + 3);
            updateData.freeTrialEndDate = freeTrialEndDate;
            updateData.subscriptionStatus = "active";
            updateData.subscriptionType = "free";
            console.log('[Google OAuth] Adding free trial to existing user:', { 
              email: user.email, 
              freeTrialEndDate: freeTrialEndDate.toISOString() 
            });
          }
          
          if (Object.keys(updateData).length > 1) { // More than just updatedAt
            await db.collection("users").updateOne(
              { email: user.email },
              { $set: updateData }
            );
            console.log('[Google OAuth] Existing user updated:', user.email);
          }
        }

        console.log('[Google OAuth] Sign in successful for:', user.email);
        return true;
      } catch (error: any) {
        console.error('[Google OAuth] Sign in error:', error);
        console.error('[Google OAuth] Error details:', {
          name: error?.name,
          message: error?.message,
          code: error?.code
        });
        // Return false to show error to user
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        const db = await getDatabase();
        const dbUser = await db.collection("users").findOne({ email: user.email });
        
        if (dbUser) {
          token.userId = dbUser._id.toString();
          token.email = dbUser.email;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.subscriptionStatus = dbUser.subscriptionStatus;
          token.subscriptionType = dbUser.subscriptionType;
          token.subscriptionEndDate = dbUser.subscriptionEndDate;
          token.subscriptionStartDate = dbUser.subscriptionStartDate;
          token.freeTrialEndDate = dbUser.freeTrialEndDate;
          token.emailVerified = dbUser.emailVerified;
          token.createdAt = dbUser.createdAt;
          token.image = dbUser.image;
          
          // Generate JWT token for our app
          token.appToken = generateToken(dbUser._id.toString(), dbUser.email, dbUser.role || "user");
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
        session.user.subscriptionType = token.subscriptionType as string;
        session.user.subscriptionEndDate = token.subscriptionEndDate as any;
        session.user.subscriptionStartDate = token.subscriptionStartDate as any;
        session.user.freeTrialEndDate = token.freeTrialEndDate as any;
        session.user.emailVerified = token.emailVerified as boolean;
        session.user.createdAt = token.createdAt as any;
        session.user.image = token.image as string;
        session.appToken = token.appToken as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('[Google OAuth] User signed in:', {
        email: user.email,
        isNewUser,
        provider: account?.provider,
      });
    },
  },
};
