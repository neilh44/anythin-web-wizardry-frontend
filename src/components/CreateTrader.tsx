import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import { tradingAPI, type TraderConfig } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface CreateTraderProps {
  onTraderCreated: () => void;
}

export function CreateTrader({ onTraderCreated }: CreateTraderProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const { toast } = useToast();

  const [config, setConfig] = useState<TraderConfig>({
    name: '',
    initial_balance: 10000,
    risk_per_trade: 0.02,
    leverage: 10,
    cooldown_minutes: 5,
    daily_loss_limit: 0.05,
    max_open_trades: 3,
    symbols: ['BTCUSDT', 'ETHUSDT'],
    rsi_period: 14,
    rsi_overbought: 70,
    rsi_oversold: 30,
    bollinger_period: 20,
    bollinger_std: 2,
    ma_short: 10,
    ma_long: 20,
    volume_threshold: 1000000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Trader name is required.",
        variant: "destructive",
      });
      return;
    }

    if (config.symbols.length === 0) {
      toast({
        title: "Validation Error", 
        description: "At least one trading symbol is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await tradingAPI.createTrader(config);
      toast({
        title: "Trader Created",
        description: `${config.name} has been created successfully.`,
      });
      setOpen(false);
      onTraderCreated();
      
      // Reset form
      setConfig({
        ...config,
        name: '',
        symbols: ['BTCUSDT', 'ETHUSDT'],
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create trader. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSymbol = () => {
    if (newSymbol.trim() && !config.symbols.includes(newSymbol.trim().toUpperCase())) {
      setConfig({
        ...config,
        symbols: [...config.symbols, newSymbol.trim().toUpperCase()]
      });
      setNewSymbol('');
    }
  };

  const removeSymbol = (symbol: string) => {
    setConfig({
      ...config,
      symbols: config.symbols.filter(s => s !== symbol)
    });
  };

  const updateConfig = (field: keyof TraderConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create New Trader
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Trading Bot</DialogTitle>
          <DialogDescription>
            Configure a new automated trading bot with custom parameters
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Trader Name</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => updateConfig('name', e.target.value)}
                    placeholder="My Trading Bot"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="balance">Initial Balance ($)</Label>
                  <Input
                    id="balance"
                    type="number"
                    value={config.initial_balance}
                    onChange={(e) => updateConfig('initial_balance', parseFloat(e.target.value))}
                    min="100"
                    step="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="risk">Risk Per Trade (%)</Label>
                  <Input
                    id="risk"
                    type="number"
                    value={config.risk_per_trade * 100}
                    onChange={(e) => updateConfig('risk_per_trade', parseFloat(e.target.value) / 100)}
                    min="0.1"
                    max="10"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="leverage">Leverage</Label>
                  <Input
                    id="leverage"
                    type="number"
                    value={config.leverage}
                    onChange={(e) => updateConfig('leverage', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dailyLimit">Daily Loss Limit (%)</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    value={config.daily_loss_limit * 100}
                    onChange={(e) => updateConfig('daily_loss_limit', parseFloat(e.target.value) / 100)}
                    min="1"
                    max="20"
                    step="0.5"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxTrades">Max Open Trades</Label>
                  <Input
                    id="maxTrades"
                    type="number"
                    value={config.max_open_trades}
                    onChange={(e) => updateConfig('max_open_trades', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cooldown">Cooldown Period (minutes)</Label>
                  <Input
                    id="cooldown"
                    type="number"
                    value={config.cooldown_minutes}
                    onChange={(e) => updateConfig('cooldown_minutes', parseInt(e.target.value))}
                    min="1"
                    max="60"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trading Symbols */}
          <Card>
            <CardHeader>
              <CardTitle>Trading Symbols</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="BTCUSDT"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymbol())}
                />
                <Button type="button" onClick={addSymbol}>Add</Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {config.symbols.map((symbol) => (
                  <Badge key={symbol} variant="outline" className="gap-1">
                    {symbol}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeSymbol(symbol)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rsiPeriod">RSI Period</Label>
                  <Input
                    id="rsiPeriod"
                    type="number"
                    value={config.rsi_period}
                    onChange={(e) => updateConfig('rsi_period', parseInt(e.target.value))}
                    min="5"
                    max="50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="rsiOverbought">RSI Overbought</Label>
                  <Input
                    id="rsiOverbought"
                    type="number"
                    value={config.rsi_overbought}
                    onChange={(e) => updateConfig('rsi_overbought', parseInt(e.target.value))}
                    min="60"
                    max="90"
                  />
                </div>
                
                <div>
                  <Label htmlFor="rsiOversold">RSI Oversold</Label>
                  <Input
                    id="rsiOversold"
                    type="number"
                    value={config.rsi_oversold}
                    onChange={(e) => updateConfig('rsi_oversold', parseInt(e.target.value))}
                    min="10"
                    max="40"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bollPeriod">Bollinger Period</Label>
                  <Input
                    id="bollPeriod"
                    type="number"
                    value={config.bollinger_period}
                    onChange={(e) => updateConfig('bollinger_period', parseInt(e.target.value))}
                    min="10"
                    max="50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bollStd">Bollinger Std Dev</Label>
                  <Input
                    id="bollStd"
                    type="number"
                    value={config.bollinger_std}
                    onChange={(e) => updateConfig('bollinger_std', parseFloat(e.target.value))}
                    min="1"
                    max="3"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="volume">Volume Threshold</Label>
                  <Input
                    id="volume"
                    type="number"
                    value={config.volume_threshold}
                    onChange={(e) => updateConfig('volume_threshold', parseInt(e.target.value))}
                    min="100000"
                    step="100000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maShort">MA Short Period</Label>
                  <Input
                    id="maShort"
                    type="number"
                    value={config.ma_short}
                    onChange={(e) => updateConfig('ma_short', parseInt(e.target.value))}
                    min="5"
                    max="50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="maLong">MA Long Period</Label>
                  <Input
                    id="maLong"
                    type="number"
                    value={config.ma_long}
                    onChange={(e) => updateConfig('ma_long', parseInt(e.target.value))}
                    min="10"
                    max="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Trader'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}