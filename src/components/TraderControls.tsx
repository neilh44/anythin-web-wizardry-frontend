import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw } from 'lucide-react';
import { tradingAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface TraderControlsProps {
  traderId: string;
  onUpdate: () => void;
}

interface TraderStatus {
  id: string;
  name: string;
  is_running: boolean;
  config: {
    initial_balance: number;
    risk_per_trade: number;
    leverage: number;
    cooldown_minutes: number;
    daily_loss_limit: number;
    max_open_trades: number;
    symbols: string[];
    rsi_period: number;
    rsi_overbought: number;
    rsi_oversold: number;
    bollinger_period: number;
    bollinger_std: number;
    ma_short: number;
    ma_long: number;
    volume_threshold: number;
  };
  balance: number;
  open_trades: number;
  daily_pnl: number;
  total_trades: number;
  last_trade_time?: string;
}

export function TraderControls({ traderId, onUpdate }: TraderControlsProps) {
  const [status, setStatus] = useState<TraderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTraderStatus();
  }, [traderId]);

  const loadTraderStatus = async () => {
    try {
      const data = await tradingAPI.getTraderStatus(traderId);
      setStatus(data);
    } catch (error) {
      console.error('Error loading trader status:', error);
    }
  };

  const handleExportTrades = async () => {
    setLoading(true);
    try {
      const data = await tradingAPI.exportTrades(traderId);
      
      // Create and download CSV file
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `trader_${traderId}_trades.csv`);
      a.click();
      
      toast({
        title: "Export Complete",
        description: "Trade history has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export trade history.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  if (!status) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading trader controls...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>Real-time trader information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={status.is_running ? "default" : "secondary"}>
                  {status.is_running ? "Running" : "Stopped"}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground">Balance</Label>
              <div className="text-lg font-semibold">${status.balance.toFixed(2)}</div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground">Open Trades</Label>
              <div className="text-lg font-semibold">{status.open_trades}</div>
            </div>
            
            <div>
              <Label className="text-sm text-muted-foreground">Daily P&L</Label>
              <div className={`text-lg font-semibold ${
                status.daily_pnl >= 0 ? 'text-profit' : 'text-loss'
              }`}>
                ${status.daily_pnl.toFixed(2)}
              </div>
            </div>
          </div>
          
          {status.last_trade_time && (
            <div>
              <Label className="text-sm text-muted-foreground">Last Trade</Label>
              <div className="text-sm">{new Date(status.last_trade_time).toLocaleString()}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Configuration</CardTitle>
          <CardDescription>Current trading parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Risk Per Trade</Label>
              <Input 
                value={`${(status.config.risk_per_trade * 100).toFixed(1)}%`} 
                readOnly 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm">Leverage</Label>
              <Input 
                value={`${status.config.leverage}x`} 
                readOnly 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm">Max Open Trades</Label>
              <Input 
                value={status.config.max_open_trades} 
                readOnly 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm">Daily Loss Limit</Label>
              <Input 
                value={`${(status.config.daily_loss_limit * 100).toFixed(1)}%`} 
                readOnly 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm">Cooldown Period</Label>
              <Input 
                value={`${status.config.cooldown_minutes} min`} 
                readOnly 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm">Volume Threshold</Label>
              <Input 
                value={status.config.volume_threshold.toLocaleString()} 
                readOnly 
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Indicators Config */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
          <CardDescription>Current indicator settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">RSI Period</Label>
              <Input 
                value={status.config.rsi_period} 
                readOnly 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm">RSI Overbought</Label>
              <Input 
                value={status.config.rsi_overbought} 
                readOnly 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm">RSI Oversold</Label>
              <Input 
                value={status.config.rsi_oversold} 
                readOnly 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm">Bollinger Period</Label>
              <Input 
                value={status.config.bollinger_period} 
                readOnly 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm">Bollinger Std Dev</Label>
              <Input 
                value={status.config.bollinger_std} 
                readOnly 
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm">MA Short/Long</Label>
              <Input 
                value={`${status.config.ma_short}/${status.config.ma_long}`} 
                readOnly 
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Symbols */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Symbols</CardTitle>
          <CardDescription>Currently monitored symbols</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {status.config.symbols.map((symbol) => (
              <Badge key={symbol} variant="outline">
                {symbol}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Trader management actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={loadTraderStatus} variant="outline" disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
            
            <Button onClick={handleExportTrades} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              Export Trades
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}