import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { z } from "zod";

const UpdateBrokerSchema = z.object({
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data = UpdateBrokerSchema.parse(body);

    // Check if broker exists and belongs to user
    const existingBroker = await prisma.broker.findFirst({
      where: {
        id: params.id,
        userId: DEMO_USER_ID
      }
    });

    if (!existingBroker) {
      return NextResponse.json(
        { error: 'Broker bulunamadı' },
        { status: 404 }
      );
    }

    // Check if another broker with same account and platform exists
    const duplicateBroker = await prisma.broker.findFirst({
      where: {
        userId: DEMO_USER_ID,
        accountId: data.accountId,
        platform: data.platform,
        id: { not: params.id }
      }
    });

    if (duplicateBroker) {
      return NextResponse.json(
        { error: 'Bu platform ve hesap numarası ile zaten başka bir broker kayıtlı' },
        { status: 400 }
      );
    }

    const broker = await prisma.broker.update({
      where: { id: params.id },
      data
    });

    return NextResponse.json(broker);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating broker:', error);
    return NextResponse.json(
      { error: 'Broker güncellenemedi' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if broker exists and belongs to user
    const existingBroker = await prisma.broker.findFirst({
      where: {
        id: params.id,
        userId: DEMO_USER_ID
      }
    });

    if (!existingBroker) {
      return NextResponse.json(
        { error: 'Broker bulunamadı' },
        { status: 404 }
      );
    }

    // Delete broker (trades will be set to null due to SetNull cascade)
    await prisma.broker.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting broker:', error);
    return NextResponse.json(
      { error: 'Broker silinemedi' },
      { status: 500 }
    );
  }
}
