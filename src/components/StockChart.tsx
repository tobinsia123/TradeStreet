import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType, Time, CandlestickSeries } from 'lightweight-charts';
import { PricePoint } from '../types/market';

interface StockChartProps {
  priceHistory: PricePoint[];
  ticker: string;
}

interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Convert price points to OHLC candlestick data
 * Groups consecutive prices into candles
 */
function convertToCandlesticks(priceHistory: PricePoint[], candlesPerGroup: number = 2): CandlestickData[] {
  if (priceHistory.length === 0) return [];

  const candles: CandlestickData[] = [];
  
  // Group prices into candles
  let candleIndex = 0;
  for (let i = 0; i < priceHistory.length; i += candlesPerGroup) {
    const group = priceHistory.slice(i, i + candlesPerGroup);
    if (group.length === 0) continue;

    const prices = group.map(p => p.price);
    const open = group[0].price;
    const close = group[group.length - 1].price;
    
    // Get the actual high and low from all prices in the group
    const actualHigh = Math.max(...prices);
    const actualLow = Math.min(...prices);
    
    // Body boundaries (open to close)
    const bodyTop = Math.max(open, close);
    const bodyBottom = Math.min(open, close);

    // Ensure valid OHLC values
    if (actualHigh < actualLow || isNaN(open) || isNaN(actualHigh) || isNaN(actualLow) || isNaN(close)) {
      continue;
    }

    // Use Unix timestamp from the first price point in the group (in seconds)
    const timestampMs = group[0].timestamp;
    const timestampSec = Math.floor(timestampMs / 1000);
    const time = timestampSec as Time;

    // Ensure wicks are visible - make wick size proportional to the body size
    // Body size is the difference between open and close
    const bodySize = bodyTop - bodyBottom || 0.01;
    
    // Wick size is proportional to body size - smaller body = smaller wicks
    // Use 20% of body size, with a minimum of $0.05 and maximum of $0.50 for very large candles
    const proportionalWickSize = Math.max(bodySize * 0.20, 0.05);
    const minWickSize = Math.min(proportionalWickSize, 0.50); // Cap at $0.50 for huge candles
    
    let finalHigh = actualHigh;
    let finalLow = actualLow;
    
    // Ensure upper wick is visible (high extends above body top)
    // If high equals or is very close to bodyTop, extend it proportionally to body size
    if (finalHigh <= bodyTop) {
      finalHigh = bodyTop + minWickSize;
    }
    
    // Ensure lower wick is visible (low extends below body bottom)  
    // If low equals or is very close to bodyBottom, extend it proportionally to body size
    if (finalLow >= bodyBottom) {
      finalLow = bodyBottom - minWickSize;
    }
    
    // Final validation - ensure high is highest, low is lowest
    // This preserves the wicks we just added above
    finalHigh = Math.max(finalHigh, bodyTop);
    finalLow = Math.min(finalLow, bodyBottom);
    
    candles.push({
      time: time,
      open: Number(open.toFixed(2)),
      high: Number(finalHigh.toFixed(2)), // High extends above body = upper wick visible
      low: Number(finalLow.toFixed(2)),   // Low extends below body = lower wick visible
      close: Number(close.toFixed(2)),
    });
    
    candleIndex++;
  }

  return candles;
}

export function StockChart({ priceHistory, ticker }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Clean up previous chart if it exists
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        // Ignore cleanup errors
      }
      chartRef.current = null;
      seriesRef.current = null;
    }
    
    const container = chartContainerRef.current;
    
    try {
      // Initialize chart
      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: '#111827' },
          textColor: '#9CA3AF',
        },
        grid: {
          vertLines: { color: '#374151', visible: true },
          horzLines: { color: '#374151', visible: true },
        },
        width: container.clientWidth || 600,
        height: 400,
        handleScroll: {
          mouseWheel: false,
          pressedMouseMove: false,
        },
        handleScale: {
          axisPressedMouseMove: false,
          mouseWheel: false,
          pinch: false,
        },
        crosshair: {
          mode: 1, // Normal crosshair mode
        },
      });

      chartRef.current = chart;

      // Create candlestick series with highly visible wicks
      // Note: lightweight-charts doesn't support custom wick thickness, 
      // but we can make them more visible with brighter colors
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#34D399', // Green body for bullish candles
        downColor: '#F87171', // Red body for bearish candles
        borderUpColor: '#10B981', // Darker green border
        borderDownColor: '#EF4444', // Darker red border
        wickUpColor: '#A7F3D0', // Very bright green wick for maximum visibility
        wickDownColor: '#FECACA', // Very bright red wick for maximum visibility
      });

      // Configure time scale to make candlesticks look like proper candlesticks (not blocks)
      chart.timeScale().applyOptions({
        barSpacing: 15, // Less spacing makes candlesticks appear wider
        rightBarStaysOnScroll: false, // Allow natural scrolling - old candles shift left
        timeVisible: false,
      });

      seriesRef.current = candlestickSeries;

      // Handle resize
      const handleResize = () => {
        if (container && chart) {
          const width = container.clientWidth || 600;
          chart.applyOptions({ width, height: 400 });
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
          try {
            chart.remove();
          } catch (error) {
            // Ignore cleanup errors
          }
        }
        chartRef.current = null;
        seriesRef.current = null;
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }, [ticker]); // Recreate chart when ticker changes

  // Update chart data when price history changes
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    
    if (priceHistory.length === 0) {
      // Clear chart if no data
      try {
        seriesRef.current.setData([]);
      } catch (error) {
        console.error('Error clearing chart data:', error);
      }
      return;
    }

    try {
      // Convert to candlestick data
      // Use more history to allow candles to shift left naturally
      const recentHistory = priceHistory.length > 100 ? priceHistory.slice(-100) : priceHistory;
      const candlestickData = convertToCandlesticks(recentHistory, 2); // 2 points per candle
      
      if (candlestickData.length > 0) {
        // Filter out invalid candles - wicks will automatically show when high > body top or low < body bottom
        const validData = candlestickData.filter(candle => {
          // Basic validation - ensure all values are valid numbers
          const isValid = !isNaN(candle.open) && 
                 !isNaN(candle.high) && 
                 !isNaN(candle.low) && 
                 !isNaN(candle.close) &&
                 candle.high >= candle.low &&
                 candle.high >= Math.max(candle.open, candle.close) && // High must be at least as high as body
                 candle.low <= Math.min(candle.open, candle.close); // Low must be at least as low as body
          
          return isValid;
        });

        if (validData.length > 0) {
          // Store the previous data to detect first load
          const isFirstLoad = !seriesRef.current || seriesRef.current.data().length === 0;
          
          if (isFirstLoad) {
            // First load - set all initial candles
            seriesRef.current.setData(validData);
            
            setTimeout(() => {
              if (chartRef.current) {
                try {
                  chartRef.current.timeScale().fitContent();
                  // Re-apply barSpacing after fitContent
                  chartRef.current.timeScale().applyOptions({
                    barSpacing: 15,
                  });
                } catch (error) {
                  console.error('Error fitting content:', error);
                }
              }
            }, 150);
          } else {
            // Subsequent updates - preserve existing candles, only update/add the newest
            if (!seriesRef.current) return;
            
            const existingDataRaw = seriesRef.current.data();
            // Filter to only get actual candlestick data (not whitespace)
            const existingData = existingDataRaw.filter((c): c is CandlestickData => 
              'open' in c && 'high' in c && 'low' in c && 'close' in c
            );
            const existingTimes = new Set(existingData.map(c => c.time));
            
            // Find which candles are new (not in existing data)
            const newCandles = validData.filter(c => !existingTimes.has(c.time));
            
            // Build the final data: preserve existing candles and add/update new ones
            const candlesToSet: typeof validData = [];
            
            // Add all existing candles first (preserving their values)
            existingData.forEach(existingCandle => {
              // Check if this candle should be kept as-is (not the last one being updated)
              const matchingNew = validData.find(c => c.time === existingCandle.time);
              if (matchingNew && existingCandle.time === existingData[existingData.length - 1]?.time) {
                // Update only the last candle (the one still being formed)
                candlesToSet.push(matchingNew);
              } else {
                // Keep existing candle unchanged
                candlesToSet.push(existingCandle);
              }
            });
            
            // Add any completely new candles
            newCandles.forEach(newCandle => {
              if (!candlesToSet.find(c => c.time === newCandle.time)) {
                candlesToSet.push(newCandle);
              }
            });
            
            // Sort by time to ensure correct order
            candlesToSet.sort((a, b) => (a.time as number) - (b.time as number));
            
            // Update the chart with preserved and new candles
            seriesRef.current.setData(candlesToSet);
            
            // Scroll to show the latest candle
            setTimeout(() => {
              if (chartRef.current) {
                try {
                  chartRef.current.timeScale().scrollToRealTime();
                } catch (error) {
                  console.error('Error scrolling to real-time:', error);
                }
              }
            }, 50);
          }
        }
      }
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [priceHistory]);

  if (priceHistory.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-500">
        No price data available
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full" ref={chartContainerRef} />
    <div className="h-64">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-300">{ticker}</div>
        <div className={`text-sm font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          ${latestPrice.toFixed(2)}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            hide
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              color: '#F3F4F6',
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#34D399' : '#F87171'}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
