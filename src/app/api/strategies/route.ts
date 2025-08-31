import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const strategySchema = z.object({
  name: z.string().min(1, "Strategy name is required"),
  description: z.string().optional(),
  rules: z.string().optional(),
  imageUrls: z.string().optional(),
});

export async function GET() {
  try {
    const strategies = await prisma.strategy.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(strategies);
  } catch (error) {
    console.error("GET /api/strategies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = strategySchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: parsed.error.format() 
      }, { status: 400 });
    }

    const strategy = await prisma.strategy.create({ data: parsed.data });
    return NextResponse.json(strategy, { status: 201 });
  } catch (error) {
    console.error("POST /api/strategies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
