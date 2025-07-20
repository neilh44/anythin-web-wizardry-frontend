import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { tradingAPI } from '@/services/api';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TechnicalIndicatorsProps {
  traderId: string;
}

interface IndicatorData {
  symbol: string;
  price: number;
  rsi: number;
  bollinger_upper: number;
  bollinger_lower: number;
  bollinger_middle: number;
  ma_short: number;
  ma_long: number;
  volume: number;
  volume_avg: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  signal_strength: number;
  last_updated: string;
}

export function TechnicalIndicators({ traderId }: TechnicalIndicatorsProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [indicators, setIndicators] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [symbols] = useState(['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT']);

  useEffect(() => {
    loadIndicators();
    const interval = setInterval(loadIndicators, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [selectedSymbol, traderId]);

  const loadIndicators = async () => {
    setLoading(true);
    try {
      const data = await tradingAPI.getTechnicalIndicators(traderId, selectedSymbol);
      setIndicators(data);
    } catch (error) {
      console.error('Error loading indicators:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRSIStatus = (rsi: number) => {
    if (rsi >= 70) return { status: 'Overbought', color: 'bg-loss text-white' };
    if (rsi <= 30) return { status: 'Oversold', color: 'bg-profit text-white' };
    return { status: 'Neutral', color: 'bg-neutral text-white' };
  };

  const getMAStatus = (price: number, maShort: number, maLong: number) => {
    if (maShort > maLong && price > maShort) {
      return { status: 'Bullish', color: 'bg-profit text-white', icon: TrendingUp };
    }
    if (maShort < maLong && price < maShort) {
      return { status: 'Bearish', color: 'bg-loss text-white', icon: TrendingDown };
    }
    return { status: 'Neutral', color: 'bg-neutral text-white', icon: Minus };
  };

  const getBollingerStatus = (price: number, upper: number, lower: number, middle: number) => {
    if (price >= upper) return { status: 'Above Upper', color: 'bg-loss text-white' };
    if (price <= lower) return { status: 'Below Lower', color: 'bg-profit text-white' };
    if (price > middle) return { status: 'Above Middle', color: 'bg-warning text-white' };
    return { status: 'Below Middle', color: 'bg-secondary' };
  };

  const getSignalBadge = (signal: string, strength: number) => {
    const colors = {
      BUY: 'bg-profit text-white',
      SELL: 'bg-loss text-white',
      HOLD: 'bg-neutral text-white'
    };
    
    return (
      <Badge className={colors[signal as keyof typeof colors]}>
        {signal} ({strength.toFixed(1)})
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select symbol" />
          </SelectTrigger>
          <SelectContent>
            {symbols.map((symbol) => (
              <SelectItem key={symbol} value={symbol}>
                {symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {indicators && (
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(indicators.last_updated).toLocaleTimeString()}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          Loading indicators...
        </div>
      )}

      {indicators && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Price & Signal */}
          <Card>
            <CardHeader>
              <CardTitle>Price & Signal</CardTitle>
              <CardDescription>{selectedSymbol}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">${indicators.price.toFixed(2)}</div>
                <div className="mt-2">
                  {getSignalBadge(indicators.signal, indicators.signal_strength)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RSI */}
          <Card>
            <CardHeader>
              <CardTitle>RSI (14)</CardTitle>
              <CardDescription>Relative Strength Index</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{indicators.rsi.toFixed(2)}</div>
                <div className="mt-2">
                  <Badge className={getRSIStatus(indicators.rsi).color}>
                    {getRSIStatus(indicators.rsi).status}
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${indicators.rsi}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Moving Averages */}
          <Card>
            <CardHeader>
              <CardTitle>Moving Averages</CardTitle>
              <CardDescription>MA Cross Analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">MA Short:</span>
                  <span className="font-medium">${indicators.ma_short.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">MA Long:</span>
                  <span className="font-medium">${indicators.ma_long.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-2">
                <Badge className={getMAStatus(indicators.price, indicators.ma_short, indicators.ma_long).color}>
                  <getMAStatus(indicators.price, indicators.ma_short, indicators.ma_long).icon className="w-3 h-3 mr-1" />
                  {getMAStatus(indicators.price, indicators.ma_short, indicators.ma_long).status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Bollinger Bands */}
          <Card>
            <CardHeader>
              <CardTitle>Bollinger Bands</CardTitle>
              <CardDescription>Price vs Bands</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Upper:</span>
                  <span className="font-medium">${indicators.bollinger_upper.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Middle:</span>
                  <span className="font-medium">${indicators.bollinger_middle.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Lower:</span>
                  <span className="font-medium">${indicators.bollinger_lower.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-2">
                <Badge className={getBollingerStatus(
                  indicators.price, 
                  indicators.bollinger_upper, 
                  indicators.bollinger_lower,
                  indicators.bollinger_middle
                ).color}>
                  {getBollingerStatus(
                    indicators.price, 
                    indicators.bollinger_upper, 
                    indicators.bollinger_lower,
                    indicators.bollinger_middle
                  ).status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Volume */}
          <Card>
            <CardHeader>
              <CardTitle>Volume Analysis</CardTitle>
              <CardDescription>Current vs Average</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Current:</span>
                  <span className="font-medium">{indicators.volume.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average:</span>
                  <span className="font-medium">{indicators.volume_avg.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-2">
                <Badge variant={indicators.volume > indicators.volume_avg ? "default" : "secondary"}>
                  {indicators.volume > indicators.volume_avg ? 'Above Average' : 'Below Average'}
                  ({((indicators.volume / indicators.volume_avg - 1) * 100).toFixed(1)}%)
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Market Sentiment */}
          <Card>
            <CardHeader>
              <CardTitle>Market Sentiment</CardTitle>
              <CardDescription>Overall analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">RSI:</span>
                  <Badge size="sm" className={getRSIStatus(indicators.rsi).color}>
                    {getRSIStatus(indicators.rsi).status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">MA Trend:</span>
                  <Badge size="sm" className={getMAStatus(indicators.price, indicators.ma_short, indicators.ma_long).color}>
                    {getMAStatus(indicators.price, indicators.ma_short, indicators.ma_long).status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bollinger:</span>
                  <Badge size="sm" className={getBollingerStatus(
                    indicators.price, 
                    indicators.bollinger_upper, 
                    indicators.bollinger_lower,
                    indicators.bollinger_middle
                  ).color}>
                    {getBollingerStatus(
                      indicators.price, 
                      indicators.bollinger_upper, 
                      indicators.bollinger_lower,
                      indicators.bollinger_middle
                    ).status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}