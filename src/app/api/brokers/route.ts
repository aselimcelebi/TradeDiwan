import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { z } from "zod";

const CreateBrokerSchema = z.object({
  name: z.string().min(1, "Broker adı gerekli"),
  platform: z.enum(["MT5", "MT4", "cTrader", "NinjaTrader", "Binance"]),
  accountId: z.string().min(1, "Hesap numarası gerekli"),
  server: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  currency: z.string().default("USD"),
  leverage: z.number().nullable().optional(),
  company: z.string().optional()
});

export async function GET() {
  try {
    const brokers = await prisma.broker.findMany({
      where: {
        userId: DEMO_USER_ID
      },
      include: {
        _count: {
          select: {
            trades: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(brokers);
  } catch (error) {
    console.error('Error fetching brokers:', error);
    return NextResponse.json(
      { error: 'Broker listesi getirilemedi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateBrokerSchema.parse(body);

    // Check if broker with same account and platform already exists
    const existingBroker = await prisma.broker.findFirst({
      where: {
        userId: DEMO_USER_ID,
        accountId: data.accountId,
        platform: data.platform
      }
    });

    if (existingBroker) {
      return NextResponse.json(
        { error: 'Bu platform ve hesap numarası ile zaten bir broker kayıtlı' },
        { status: 400 }
      );
    }

    const broker = await prisma.broker.create({
      data: {
        userId: DEMO_USER_ID,
        ...data,
        status: 'disconnected'
      }
    });

    return NextResponse.json(broker, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating broker:', error);
    return NextResponse.json(
      { error: 'Broker oluşturulamadı' },
      { status: 500 }
    );
  }
}
