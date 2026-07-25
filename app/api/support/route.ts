import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getDatabase } from "@/lib/mongodb";
import { sendSupportTicketEmails } from "@/lib/support-email";

const QUERY_LABELS: Record<string, string> = {
  payment: "Payment Issue",
  credentials: "Lost Credentials",
  signals: "How to Read Signal",
  account: "Account Management",
  other: "Other",
};

function ticketNumber() {
  return `RP-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phoneNumber, queryType, description } = body as {
      name?: string;
      email?: string;
      phoneNumber?: string;
      queryType?: string;
      description?: string;
    };

    if (!name?.trim() || !email?.trim() || !phoneNumber?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const qt = queryType && QUERY_LABELS[queryType] ? queryType : "other";
    const queryTypeLabel = QUERY_LABELS[qt] || "Other";
    const number = ticketNumber();

    const db = await getDatabase();
    const doc = {
      ticketNumber: number,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      queryType: qt,
      queryTypeLabel,
      description: description.trim(),
      status: "open" as const,
      staffEmailSent: false,
      userEmailSent: false,
      emailError: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection("support_requests").insertOne(doc);

    const emailResult = await sendSupportTicketEmails({
      ticketNumber: number,
      name: doc.name,
      email: doc.email,
      phoneNumber: doc.phoneNumber,
      queryTypeLabel,
      description: doc.description,
    });

    await db.collection("support_requests").updateOne(
      { _id: insertResult.insertedId },
      {
        $set: {
          staffEmailSent: emailResult.staffSent,
          userEmailSent: emailResult.userSent,
          emailError: emailResult.error || null,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        message: "Support request submitted successfully",
        ticketNumber: number,
        id: insertResult.insertedId.toString(),
        notifications: {
          staffEmailSent: emailResult.staffSent,
          userEmailSent: emailResult.userSent,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting support request:", error);
    return NextResponse.json(
      { error: "Failed to submit support request" },
      { status: 500 }
    );
  }
}
