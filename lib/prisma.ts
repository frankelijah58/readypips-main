import { getDatabase } from "./mongodb";
import { ObjectId } from "mongodb";

// Prisma-like interface for MongoDB
export const prisma = {
  user: {
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      const db = await getDatabase();
      let query: any = {};
      
      if (where.email) {
        query.email = where.email.toLowerCase();
      } else if (where.id) {
        query._id = new ObjectId(where.id);
      }
      
      const user = await db.collection("users").findOne(query);
      if (!user) return null;
      
      return {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password,
        subscriptionStatus: user.subscriptionStatus || "inactive",
        subscriptionType: user.subscriptionType || null,
        subscriptionEndDate: user.subscriptionEndDate,
        emailVerified: user.emailVerified || false,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    },
    
    update: async ({ where, data }: { where: { id?: string; email?: string }; data: any }) => {
      const db = await getDatabase();
      let query: any = {};
      
      if (where.id) {
        query._id = new ObjectId(where.id);
      } else if (where.email) {
        query.email = where.email;
      }
      
      const result = await db.collection("users").updateOne(
        query,
        { $set: { ...data, updatedAt: new Date() } }
      );
      return result;
    },
    
    create: async ({ data }: { data: any }) => {
      const db = await getDatabase();
      const userData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection("users").insertOne(userData);
      return {
        id: result.insertedId.toString(),
        ...userData,
      };
    },
  },
  
  passwordReset: {
    create: async ({ data }: { data: any }) => {
      const db = await getDatabase();
      const resetData = {
        ...data,
        createdAt: new Date(),
      };
      const result = await db.collection("passwordResets").insertOne(resetData);
      return {
        id: result.insertedId.toString(),
        ...resetData,
      };
    },
    
    findFirst: async ({ where }: { where: any }) => {
      const db = await getDatabase();
      let query: any = {};
      
      if (where.email) {
        query.email = where.email;
      }
      if (where.token) {
        query.token = where.token;
      }
      if (where.expiresAt && where.expiresAt.gt) {
        query.expiresAt = { $gt: where.expiresAt.gt };
      }
      
      const reset = await db.collection("passwordResets").findOne(query);
      if (!reset) return null;
      
      return {
        id: reset._id.toString(),
        email: reset.email,
        token: reset.token,
        expiresAt: reset.expiresAt,
        createdAt: reset.createdAt,
      };
    },
    
    delete: async ({ where }: { where: { id: string } }) => {
      const db = await getDatabase();
      const result = await db.collection("passwordResets").deleteOne({
        _id: new ObjectId(where.id)
      });
      return result;
    },
    
    deleteMany: async ({ where }: { where: any }) => {
      const db = await getDatabase();
      let query: any = {};
      
      if (where.email) {
        query.email = where.email;
      }
      if (where.token) {
        query.token = where.token;
      }
      
      const result = await db.collection("passwordResets").deleteMany(query);
      return result;
    },
  },
  
  emailVerification: {
    create: async ({ data }: { data: any }) => {
      const db = await getDatabase();
      const verificationData = {
        ...data,
        createdAt: new Date(),
      };
      const result = await db.collection("emailVerifications").insertOne(verificationData);
      return {
        id: result.insertedId.toString(),
        ...verificationData,
      };
    },
    
    findFirst: async ({ where }: { where: any }) => {
      const db = await getDatabase();
      let query: any = {};
      
      if (where.email) {
        query.email = where.email;
      }
      if (where.token) {
        query.token = where.token;
      }
      
      const verification = await db.collection("emailVerifications").findOne(query);
      if (!verification) return null;
      
      return {
        id: verification._id.toString(),
        email: verification.email,
        token: verification.token,
        expiresAt: verification.expiresAt,
        createdAt: verification.createdAt,
      };
    },
    
    deleteMany: async ({ where }: { where: any }) => {
      const db = await getDatabase();
      let query: any = {};
      
      if (where.email) {
        query.email = where.email;
      }
      if (where.token) {
        query.token = where.token;
      }
      
      const result = await db.collection("emailVerifications").deleteMany(query);
      return result;
    },
  },
};
