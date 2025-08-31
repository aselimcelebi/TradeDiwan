import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { z } from "zod";

const tradeSchema = z.object({
  date: z.string(),
  symbol: z.string().min(1, "Symbol is required"),
  side: z.enum(["LONG", "SHORT"]),
  qty: z.number().positive("Quantity must be positive"),
  entryPrice: z.number().positive("Entry price must be positive"),
  exitPrice: z.number().positive("Exit price must be positive"),
  fees: z.number().nonnegative("Fees cannot be negative").default(0),
  risk: z.number().positive().optional(),
  strategy: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const symbol = searchParams.get("symbol");
    const strategy = searchParams.get("strategy");
    const side = searchParams.get("side");
    const outcome = searchParams.get("outcome");
    const brokerId = searchParams.get("brokerId");

    const where: any = { userId: DEMO_USER_ID };

    // Broker filter
    if (brokerId && brokerId !== '') {
      where.brokerId = brokerId;
    }

    // Date range filter
    if (from || to) {
      where.date = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) })
      };
    }

    // Symbol filter
    if (symbol && symbol !== '') {
      where.symbol = {
        contains: symbol,
        mode: 'insensitive'
      };
    }

    // Strategy filter
    if (strategy && strategy !== '') {
      where.strategy = {
        contains: strategy,
        mode: 'insensitive'
      };
    }

    // Side filter
    if (side && side !== 'ALL') {
      where.side = side;
    }

    const trades = await prisma.trade.findMany({
      where,
      include: {
        broker: {
          select: {
            name: true,
            platform: true,
            accountId: true,
          }
        }
      },
      orderBy: { date: "desc" }
    });

    // Apply outcome filter in memory (since it's calculated)
    let filteredTrades = trades;
    if (outcome && outcome !== 'ALL') {
      filteredTrades = trades.filter(trade => {
        const gross = (trade.exitPrice - trade.entryPrice) * trade.qty * (trade.side === 'LONG' ? 1 : -1);
        const pnl = gross - trade.fees;
        
        if (outcome === 'WIN') return pnl > 0;
        if (outcome === 'LOSS') return pnl <= 0;
        return true;
      });
    }

    return NextResponse.json(filteredTrades);
  } catch (error) {
    console.error("GET /api/trades error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = tradeSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: parsed.error.format() 
      }, { status: 400 });
    }

    const tradeData = {
      ...parsed.data,
      date: new Date(parsed.data.date),
      userId: DEMO_USER_ID,
      imageUrl: parsed.data.imageUrl || null,
    };

    const trade = await prisma.trade.create({ data: tradeData });
    return NextResponse.json(trade, { status: 201 });
  } catch (error) {
    console.error("POST /api/trades error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: "Trade ID is required" }, { status: 400 });
    }

    const parsed = tradeSchema.safeParse(updateData);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: parsed.error.format() 
      }, { status: 400 });
    }

    const tradeData = {
      ...parsed.data,
      date: new Date(parsed.data.date),
      imageUrl: parsed.data.imageUrl || null,
    };

    const trade = await prisma.trade.update({
      where: { id, userId: DEMO_USER_ID },
      data: tradeData,
    });
    
    return NextResponse.json(trade);
  } catch (error) {
    console.error("PUT /api/trades error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Trade ID is required" }, { status: 400 });
    }

    await prisma.trade.delete({
      where: { id, userId: DEMO_USER_ID },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/trades error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
