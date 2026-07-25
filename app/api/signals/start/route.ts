import { NextRequest, NextResponse } from "next/server";
import { SignalService } from "@/lib/signal-service";

export async function POST(request: NextRequest) {
  try {
    const signalService = SignalService.getInstance();
    await signalService.startSignalGeneration();

    return NextResponse.json({
      message: "Signal generation service started successfully",
      status: "running",
    });
  } catch (error) {
    console.error("Error starting signal generation service:", error);
    return NextResponse.json(
      { error: "Failed to start signal generation service" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const signalService = SignalService.getInstance();
    // Generate signals on demand
    await signalService.generateAndSaveSignals();

    return NextResponse.json({
      message: "Signals generated successfully",
      status: "completed",
    });
  } catch (error) {
    console.error("Error generating signals:", error);
    return NextResponse.json(
      { error: "Failed to generate signals" },
      { status: 500 }
    );
  }
}
