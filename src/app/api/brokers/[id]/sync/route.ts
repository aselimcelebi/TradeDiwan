import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID } from "@/lib/demoUser";
import { BinanceClient } from "@/lib/binance-client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get broker info
    const broker = await prisma.broker.findFirst({
      where: {
        id: params.id,
        userId: DEMO_USER_ID
      }
    });

    if (!broker) {
      return NextResponse.json(
        { error: 'Broker bulunamadı' },
        { status: 404 }
      );
    }

    if (broker.platform !== 'Binance') {
      return NextResponse.json(
        { error: 'Bu fonksiyon sadece Binance için desteklenir' },
        { status: 400 }
      );
    }

    if (!broker.apiKey || !broker.apiSecret) {
      return NextResponse.json(
        { error: 'Binance API bilgileri eksik' },
        { status: 400 }
      );
    }

    // Update broker status to connecting
    await prisma.broker.update({
      where: { id: params.id },
      data: { status: 'connecting' }
    });

    try {
      const binanceClient = new BinanceClient(broker.apiKey, broker.apiSecret);

      // Test connection first
      const connectionTest = await binanceClient.testConnection();
      if (!connectionTest) {
        throw new Error('Binance bağlantı testi başarısız');
      }

      // Get account info to verify API keys
      const accountInfo = await binanceClient.getAccountInfo();
      console.log('Binance account verified:', accountInfo.accountType);

      // Get popular trading symbols to check for trades
      const popularSymbols = [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT', 
        'XRPUSDT', 'LTCUSDT', 'LINKUSDT', 'BCHUSDT', 'XLMUSDT',
        'UNIUSDT', 'DOGEUSDT', 'SOLUSDT', 'MATICUSDT', 'AVAXUSDT'
      ];

      let allTrades: any[] = [];

      // Check trades for each popular symbol
      for (const symbol of popularSymbols) {
        try {
          const symbolTrades = await binanceClient.getMyTrades(symbol, 50);
          if (symbolTrades && symbolTrades.length > 0) {
            allTrades.push(...symbolTrades);
            console.log(`Found ${symbolTrades.length} trades for ${symbol}`);
          }
        } catch (symbolError: any) {
          // Skip symbols that user hasn't traded
          if (!symbolError.message?.includes('400')) {
            console.error(`Error getting trades for ${symbol}:`, symbolError);
          }
        }
      }

      console.log(`Total trades found: ${allTrades.length}`);

      let importedCount = 0;
      let skippedCount = 0;

      for (const binanceTrade of allTrades) {
        try {
          // Check if trade already exists (using trade ID)
          const tradeId = binanceTrade.id || binanceTrade.orderId;
          const existingTrade = await prisma.trade.findFirst({
            where: {
              userId: DEMO_USER_ID,
              brokerId: broker.id,
              notes: {
                contains: `Binance Trade ID: ${tradeId}`
              }
            }
          });

          if (existingTrade) {
            skippedCount++;
            continue;
          }

          // Convert and save trade
          const tradeData = BinanceClient.convertToTradeFormat(binanceTrade, broker.id);
          
          await prisma.trade.create({
            data: {
              userId: DEMO_USER_ID,
              ...tradeData
            }
          });

          importedCount++;
        } catch (tradeError) {
          console.error('Error importing individual trade:', tradeError);
        }
      }

      // Update broker status to connected
      await prisma.broker.update({
        where: { id: params.id },
        data: {
          status: 'connected',
          lastSync: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: `${importedCount} yeni trade eklendi, ${skippedCount} trade zaten mevcut`,
        importedCount,
        skippedCount,
        totalTrades: allTrades.length
      });

    } catch (apiError) {
      console.error('Binance API Error:', apiError);
      
      // Update broker status to error
      await prisma.broker.update({
        where: { id: params.id },
        data: { status: 'error' }
      });

      return NextResponse.json(
        { 
          error: 'Binance API hatası', 
          details: apiError instanceof Error ? apiError.message : 'Bilinmeyen hata'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Senkronizasyon hatası' },
      { status: 500 }
    );
  }
}
