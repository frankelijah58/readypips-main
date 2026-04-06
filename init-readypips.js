const dbName = "READYPIPS";
const dbx = db.getSiblingDB(dbName);

// USERS
dbx.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "createdAt"],
      properties: {
        firstName: { bsonType: ["string", "null"] },
        lastName: { bsonType: ["string", "null"] },
        fullName: { bsonType: ["string", "null"] },
        email: { bsonType: "string" },
        password: { bsonType: "string" },
        phone: { bsonType: ["string", "null"] },
        phoneNumber: { bsonType: ["string", "null"] },
        country: { bsonType: ["string", "null"] },
        role: { bsonType: ["string", "null"] },
        isAdmin: { bsonType: ["bool", "null"] },
        isPremium: { bsonType: ["bool", "null"] },
        emailVerified: { bsonType: ["bool", "null"] },
        emailVerifiedAt: { bsonType: ["date", "null"] },
        subscriptionStatus: { bsonType: ["string", "null"] },
        subscriptionType: { bsonType: ["string", "null"] },
        subscriptionEndDate: { bsonType: ["date", "null"] },
        freeTrialEndDate: { bsonType: ["date", "null"] },
        refereer: { bsonType: ["string", "null"] },
        partnerProfile: { bsonType: ["object", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] },
        lastLogin: { bsonType: ["date", "null"] }
      }
    }
  }
});

// ADMINS
dbx.createCollection("admins", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "role"],
      properties: {
        fullName: { bsonType: ["string", "null"] },
        email: { bsonType: "string" },
        password: { bsonType: "string" },
        role: { bsonType: "string" },
        isActive: { bsonType: ["bool", "null"] },
        permissions: { bsonType: ["array", "null"] },
        createdAt: { bsonType: ["date", "null"] },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  }
});

// SUBSCRIPTIONS
dbx.createCollection("subscriptions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "status"],
      properties: {
        userId: { bsonType: "string" },
        planId: { bsonType: ["string", "null"] },
        plan: { bsonType: ["string", "null"] },
        amount: { bsonType: ["number", "null"] },
        price: { bsonType: ["number", "null"] },
        status: { bsonType: "string" },
        startDate: { bsonType: ["date", "null"] },
        endDate: { bsonType: ["date", "null"] },
        autoRenew: { bsonType: ["bool", "null"] },
        createdAt: { bsonType: ["date", "null"] },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  }
});

// PAYMENT INTENTS
dbx.createCollection("payment_intents", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["reference", "provider", "amount", "status", "createdAt"],
      properties: {
        reference: { bsonType: "string" },
        userId: { bsonType: ["string", "null"] },
        email: { bsonType: ["string", "null"] },
        planId: { bsonType: ["string", "null"] },
        provider: { bsonType: "string" },
        amount: { bsonType: "number" },
        currency: { bsonType: ["string", "null"] },
        status: { bsonType: "string" },
        phone: { bsonType: ["string", "null"] },
        paymentIntentId: { bsonType: ["string", "null"] },
        merchantRequestID: { bsonType: ["string", "null"] },
        checkoutRequestID: { bsonType: ["string", "null"] },
        customerMessage: { bsonType: ["string", "null"] },
        paystackAccessCode: { bsonType: ["string", "null"] },
        paystackReference: { bsonType: ["string", "null"] },
        rawPaystackResponse: { bsonType: ["object", "null"] },
        rawBinanceResponse: { bsonType: ["object", "null"] },
        rawTokenResponse: { bsonType: ["object", "null"] },
        rawStkResponse: { bsonType: ["object", "null"] },
        responseCode: { bsonType: ["string", "null"] },
        responseDescription: { bsonType: ["string", "null"] },
        failureReason: { bsonType: ["string", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  }
});

// PAYMENTS
dbx.createCollection("payments", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["provider", "amount", "status", "createdAt"],
      properties: {
        reference: { bsonType: ["string", "null"] },
        sessionId: { bsonType: ["string", "null"] },
        userId: { bsonType: ["string", "null"] },
        email: { bsonType: ["string", "null"] },
        planId: { bsonType: ["string", "null"] },
        planName: { bsonType: ["string", "null"] },
        provider: { bsonType: "string" },
        amount: { bsonType: "number" },
        currency: { bsonType: ["string", "null"] },
        status: { bsonType: "string" },
        paymentIntentId: { bsonType: ["string", "null"] },
        transactionId: { bsonType: ["string", "null"] },
        senderWallet: { bsonType: ["string", "null"] },
        network: { bsonType: ["string", "null"] },
        depositAddress: { bsonType: ["string", "null"] },
        note: { bsonType: ["string", "null"] },
        merchantRequestID: { bsonType: ["string", "null"] },
        checkoutRequestID: { bsonType: ["string", "null"] },
        phone: { bsonType: ["string", "null"] },
        customerMessage: { bsonType: ["string", "null"] },
        responseCode: { bsonType: ["string", "null"] },
        responseDescription: { bsonType: ["string", "null"] },
        rawStkResponse: { bsonType: ["object", "null"] },
        paymentData: { bsonType: ["object", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  }
});

// ANALYSES
dbx.createCollection("analyses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["publicId", "symbol", "analysis", "createdAt"],
      properties: {
        publicId: { bsonType: "string" },
        symbol: { bsonType: "string" },
        timeframe: { bsonType: ["string", "null"] },
        analysis: { bsonType: "string" },
        isArchived: { bsonType: ["bool", "null"] },
        newsWarnings: { bsonType: ["array", "null"] },
        creditUsed: { bsonType: ["bool", "null"] },
        validationToken: { bsonType: ["string", "null"] },
        validationAttempted: { bsonType: ["bool", "null"] },
        metadata: { bsonType: ["object", "null"] },
        votes: { bsonType: ["array", "null"] },
        userVote: { bsonType: ["object", "null"] },
        isInvalid: { bsonType: ["bool", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  }
});

// SIGNALS
dbx.createCollection("signals", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["symbol", "signal", "createdAt"],
      properties: {
        symbol: { bsonType: "string" },
        signal: { bsonType: "string" },
        entry: { bsonType: ["number", "null"] },
        stopLoss: { bsonType: ["number", "null"] },
        takeProfit: { bsonType: ["number", "null"] },
        timeframe: { bsonType: ["string", "null"] },
        notes: { bsonType: ["string", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  }
});

// ANNOUNCEMENTS
dbx.createCollection("announcements", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "content", "createdAt"],
      properties: {
        title: { bsonType: "string" },
        content: { bsonType: "string" },
        type: { bsonType: ["string", "null"] },
        targetAudience: { bsonType: ["string", "null"] },
        priority: { bsonType: ["string", "null"] },
        status: { bsonType: ["string", "null"] },
        isActive: { bsonType: ["bool", "null"] },
        scheduledFor: { bsonType: ["date", "null"] },
        expiresAt: { bsonType: ["date", "null"] },
        createdBy: { bsonType: ["objectId", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] },
        viewCount: { bsonType: ["int", "long", "double", "null"] }
      }
    }
  }
});

// EMAIL CAMPAIGNS
dbx.createCollection("email_campaigns", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["subject", "content", "createdAt"],
      properties: {
        subject: { bsonType: "string" },
        content: { bsonType: "string" },
        targetAudience: { bsonType: ["string", "null"] },
        totalRecipients: { bsonType: ["int", "long", "double", "null"] },
        sentCount: { bsonType: ["int", "long", "double", "null"] },
        failedCount: { bsonType: ["int", "long", "double", "null"] },
        status: { bsonType: ["string", "null"] },
        createdBy: { bsonType: ["objectId", "null"] },
        createdAt: { bsonType: "date" },
        sentAt: { bsonType: ["date", "null"] }
      }
    }
  }
});

// TOOLS
dbx.createCollection("tools", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "category", "createdAt"],
      properties: {
        name: { bsonType: "string" },
        description: { bsonType: ["string", "null"] },
        category: { bsonType: "string" },
        version: { bsonType: ["string", "null"] },
        isActive: { bsonType: ["bool", "null"] },
        enabled: { bsonType: ["bool", "null"] },
        accessLevel: { bsonType: ["string", "null"] },
        createdBy: { bsonType: ["objectId", "null"] },
        updatedBy: { bsonType: ["objectId", "null"] },
        userCount: { bsonType: ["int", "long", "double", "null"] },
        popularity: { bsonType: ["int", "long", "double", "null"] },
        ratings: { bsonType: ["int", "long", "double", "null"] },
        reviews: { bsonType: ["int", "long", "double", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] },
        disabledAt: { bsonType: ["date", "null"] },
        disabledBy: { bsonType: ["objectId", "null"] }
      }
    }
  }
});

// PLAN TOOL MAPPINGS
dbx.createCollection("plan_tool_mappings", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["plan"],
      properties: {
        plan: { bsonType: "string" },
        toolIds: { bsonType: ["array", "null"] }
      }
    }
  }
});

// PASSWORD RESETS
dbx.createCollection("passwordResets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "token", "expiresAt", "createdAt"],
      properties: {
        email: { bsonType: "string" },
        token: { bsonType: "string" },
        expiresAt: { bsonType: "date" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

// WITHDRAWALS
dbx.createCollection("withdrawals", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "amount", "status", "createdAt"],
      properties: {
        userId: { bsonType: ["objectId", "string"] },
        amount: { bsonType: "number" },
        status: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  }
});

// SUPPORT REQUESTS (public contact form + admin read-only inbox)
dbx.createCollection("support_requests", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["ticketNumber", "name", "email", "phoneNumber", "description", "createdAt"],
      properties: {
        ticketNumber: { bsonType: "string" },
        name: { bsonType: "string" },
        email: { bsonType: "string" },
        phoneNumber: { bsonType: "string" },
        queryType: { bsonType: "string" },
        queryTypeLabel: { bsonType: ["string", "null"] },
        description: { bsonType: "string" },
        status: { bsonType: ["string", "null"] },
        staffEmailSent: { bsonType: ["bool", "null"] },
        userEmailSent: { bsonType: ["bool", "null"] },
        emailError: { bsonType: ["string", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  }
});

// INDEXES
dbx.users.createIndex({ email: 1 }, { unique: true });
dbx.admins.createIndex({ email: 1 }, { unique: true });
dbx.subscriptions.createIndex({ userId: 1 });
dbx.payment_intents.createIndex({ reference: 1 }, { unique: true });
dbx.payment_intents.createIndex({ userId: 1, provider: 1, status: 1 });
dbx.payments.createIndex({ reference: 1 });
dbx.payments.createIndex({ transactionId: 1, provider: 1 });
dbx.payments.createIndex({ userId: 1, createdAt: -1 });
dbx.analyses.createIndex({ publicId: 1 }, { unique: true });
dbx.analyses.createIndex({ symbol: 1, createdAt: -1 });
dbx.signals.createIndex({ symbol: 1, createdAt: -1 });
dbx.announcements.createIndex({ createdAt: -1 });
dbx.email_campaigns.createIndex({ createdAt: -1 });
dbx.tools.createIndex({ category: 1 });
dbx.passwordResets.createIndex({ email: 1 });
dbx.passwordResets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
dbx.withdrawals.createIndex({ userId: 1, createdAt: -1 });
dbx.support_requests.createIndex({ ticketNumber: 1 }, { unique: true });
dbx.support_requests.createIndex({ createdAt: -1 });
dbx.support_requests.createIndex({ email: 1 });

print("ReadyPips database and collections created successfully.");
