import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for MT5 data validation
const MT5TradeSchema = z.object({
  type: z.enum(['trade', 'account', 'ping', 'heartbeat', 'disconnect']),
  appId: z.string(),
  timestamp: z.number(),
  account: z.object({
    login: z.number(),
    server: z.string(),
  }).optional(),
  trade: z.object({
    ticket: z.number(),
    symbol: z.string(),
    type: z.number(), // 0=BUY, 1=SELL
    volume: z.number(),
    openPrice: z.number(),
    closePrice: z.number(),
    openTime: z.number(),
    closeTime: z.number(),
    profit: z.number(),
    commission: z.number(),
    swap: z.number(),
    fee: z.number(),
    comment: z.string(),
    positionId: z.number(),
    magicNumber: z.number().optional(),
  }).optional(),
});

const MT5AccountSchema = z.object({
  type: z.literal('account'),
  appId: z.string(),
  timestamp: z.number(),
  account: z.object({
    login: z.number(),
    name: z.string(),
    server: z.string(),
    currency: z.string(),
    company: z.string().optional(),
    leverage: z.number(),
    balance: z.number(),
    equity: z.number(),
    margin: z.number(),
    freeMargin: z.number(),
    marginLevel: z.number(),
    credit: z.number().optional(),
  }),
});

// Store active MT5 connections
const activeConnections = new Map<string, {
  appId: string;
  account: any;
  lastHeartbeat: Date;
  status: 'active' | 'inactive';
}>();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Log the incoming data for debugging
    console.log('🔄 MT5 Data received:', data);

    // Validate API key if provided
    const authHeader = request.headers.get('authorization');
    if (authHeader && !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Invalid authorization header' },
        { status: 401 }
      );
    }

    // Handle different message types
    switch (data.type) {
      case 'ping':
        return handlePing(data);
      
      case 'heartbeat':
        return handleHeartbeat(data);
      
      case 'disconnect':
        return handleDisconnect(data);
      
      case 'account':
        return await handleAccountInfo(data);
      
      case 'trade':
        return await handleTradeData(data);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown message type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ MT5 import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process MT5 data' },
      { status: 500 }
    );
  }
}

// Handle ping requests
function handlePing(data: any) {
  console.log('🏓 MT5 Ping received from:', data.appId);
  return NextResponse.json({
    success: true,
    message: 'Pong',
    timestamp: Date.now(),
    serverTime: new Date().toISOString(),
  });
}

// Handle heartbeat
function handleHeartbeat(data: any) {
  if (activeConnections.has(data.appId)) {
    const connection = activeConnections.get(data.appId)!;
    connection.lastHeartbeat = new Date();
    connection.status = 'active';
    activeConnections.set(data.appId, connection);
  }
  
  return NextResponse.json({
    success: true,
    message: 'Heartbeat received',
  });
}

// Handle disconnect
function handleDisconnect(data: any) {
  if (activeConnections.has(data.appId)) {
    const connection = activeConnections.get(data.appId)!;
    connection.status = 'inactive';
    activeConnections.set(data.appId, connection);
  }
  
  console.log('🔌 MT5 Disconnected:', data.appId);
  return NextResponse.json({
    success: true,
    message: 'Disconnect acknowledged',
  });
}

// Handle account information
async function handleAccountInfo(data: any) {
  try {
    const validatedData = MT5AccountSchema.parse(data);
    
    // Store connection info
    activeConnections.set(validatedData.appId, {
      appId: validatedData.appId,
      account: validatedData.account,
      lastHeartbeat: new Date(),
      status: 'active',
    });
    
    console.log('🏦 MT5 Account connected:', validatedData.account.login, 'on', validatedData.account.server);
    
    return NextResponse.json({
      success: true,
      message: 'Account info received',
      account: validatedData.account,
    });
    
  } catch (error) {
    console.error('❌ Account info validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid account data format' },
      { status: 400 }
    );
  }
}

// Handle trade data
async function handleTradeData(data: any) {
  try {
    const validatedData = MT5TradeSchema.parse(data);
    
    if (!validatedData.trade || !validatedData.account) {
      return NextResponse.json(
        { success: false, error: 'Missing trade or account data' },
        { status: 400 }
      );
    }

    const trade = validatedData.trade;
    const account = validatedData.account;

    // Check for duplicate trades
    const existingTrade = await prisma.trade.findFirst({
      where: {
        notes: {
          contains: `MT5 Ticket: ${trade.ticket}`,
        },
      },
    });

    if (existingTrade) {
      console.log('⚠️ Duplicate trade detected, skipping:', trade.ticket);
      return NextResponse.json({
        success: true,
        message: 'Trade already exists',
        tradeId: existingTrade.id,
      });
    }

    // Calculate total fees
    const totalFees = Math.abs(trade.commission) + Math.abs(trade.swap) + Math.abs(trade.fee);

    // Create trade record in database
    const newTrade = await prisma.trade.create({
      data: {
        userId: "demo", // For now, using demo user
        date: new Date(trade.closeTime * 1000), // Convert from Unix timestamp
        symbol: trade.symbol,
        side: trade.type === 0 ? 'LONG' : 'SHORT', // MT5: 0=BUY, 1=SELL
        qty: trade.volume,
        entryPrice: trade.openPrice,
        exitPrice: trade.closePrice,
        fees: totalFees,
        notes: `MT5 Ticket: ${trade.ticket} | Server: ${account.server} | Account: ${account.login}${trade.comment ? ` | ${trade.comment}` : ''}`,
        strategy: 'MT5 Auto Import',
        tags: ['mt5', 'auto-import', account.server.toLowerCase()].join(','),
      },
    });

    console.log('✅ MT5 Trade imported:', {
      id: newTrade.id,
      symbol: trade.symbol,
      side: trade.type === 0 ? 'BUY' : 'SELL',
      volume: trade.volume,
      profit: trade.profit,
      ticket: trade.ticket,
    });

    return NextResponse.json({
      success: true,
      tradeId: newTrade.id,
      message: 'Trade imported successfully',
      trade: {
        id: newTrade.id,
        symbol: newTrade.symbol,
        side: newTrade.side,
        pnl: trade.profit,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ MT5 trade validation error:', error.errors);
      return NextResponse.json(
        { success: false, error: 'Invalid trade data format', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ MT5 trade import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import trade' },
      { status: 500 }
    );
  }
}

// Get MT5 connection status
export async function GET(request: NextRequest) {
  try {
    const connections = Array.from(activeConnections.values()).map(conn => ({
      appId: conn.appId,
      account: {
        login: conn.account.login,
        server: conn.account.server,
        currency: conn.account.currency,
        balance: conn.account.balance,
        equity: conn.account.equity,
      },
      lastHeartbeat: conn.lastHeartbeat,
      status: conn.status,
      isOnline: (Date.now() - conn.lastHeartbeat.getTime()) < 60000, // Online if heartbeat within 1 minute
    }));

    return NextResponse.json({
      success: true,
      connections,
      totalConnections: connections.length,
      onlineConnections: connections.filter(c => c.isOnline).length,
    });

  } catch (error) {
    console.error('❌ MT5 status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get connection status' },
      { status: 500 }
    );
  }
}