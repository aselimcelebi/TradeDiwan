import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { z } from "zod";

const journalEntrySchema = z.object({
  date: z.string(),
  whatWentWell: z.string().optional(),
  toImprove: z.string().optional(),
  mood: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (date) {
      // Get specific date entry
      const entry = await prisma.journalEntry.findUnique({
        where: {
          userId_date: {
            userId: DEMO_USER_ID,
            date: new Date(date),
          },
        },
      });
      return NextResponse.json(entry);
    } else {
      // Get all entries
      const entries = await prisma.journalEntry.findMany({
        where: { userId: DEMO_USER_ID },
        orderBy: { date: "desc" },
      });
      return NextResponse.json(entries);
    }
  } catch (error) {
    console.error("GET /api/journal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = journalEntrySchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: parsed.error.format() 
      }, { status: 400 });
    }

    const entryData = {
      ...parsed.data,
      date: new Date(parsed.data.date),
      userId: DEMO_USER_ID,
    };

    const entry = await prisma.journalEntry.upsert({
      where: {
        userId_date: {
          userId: DEMO_USER_ID,
          date: entryData.date,
        },
      },
      create: entryData,
      update: entryData,
    });
    
    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error("POST /api/journal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const parsed = journalEntrySchema.safeParse(data);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: parsed.error.format() 
      }, { status: 400 });
    }

    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...parsed.data,
        date: new Date(parsed.data.date),
      },
    });
    
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("PUT /api/journal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
