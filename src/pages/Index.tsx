import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { tradingAPI } from '@/services/api';
import { TraderDashboard } from '@/components/TraderDashboard';
import { CreateTrader } from '@/components/CreateTrader';
import { useToast } from '@/hooks/use-toast';

interface Trader {
  id: string;
  name: string;
  is_running: boolean;
  balance: number;
  daily_pnl: number;
  total_trades: number;
  open_trades: number;
}

const Index = () => {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [selectedTrader, setSelectedTrader] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTraders();
    const interval = setInterval(loadTraders, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTraders = async () => {
    try {
      const data = await tradingAPI.getTraders();
      setTraders(data);
      
      if (!selectedTrader && data.length > 0) {
        setSelectedTrader(data[0].id);
      }
      
      if (selectedTrader && !data.find(t => t.id === selectedTrader)) {
        setSelectedTrader(data.length > 0 ? data[0].id : null);
      }
    } catch (error) {
      console.error('Error loading traders:', error);
      toast({
        title: "Connection Error",
        description: "Failed to load traders. Make sure the backend is running.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTraderCreated = () => {
    loadTraders();
  };

  const handleTraderDeleted = () => {
    setSelectedTrader(null);
    loadTraders();
  };

  const selectedTraderData = traders.find(t => t.id === selectedTrader);
  const totalBalance = traders.reduce((sum, trader) => sum + trader.balance, 0);
  const totalDailyPnL = traders.reduce((sum, trader) => sum + trader.daily_pnl, 0);
  const totalTrades = traders.reduce((sum, trader) => sum + trader.total_trades, 0);
  const runningTraders = traders.filter(t => t.is_running).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold mb-2">Loading Trading Dashboard</h2>
          <p className="text-muted-foreground">Connecting to trading backend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trading Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and control your automated trading bots
            </p>
          </div>
          <CreateTrader onTraderCreated={handleTraderCreated} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Daily P&L: ${totalDailyPnL.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Traders</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{runningTraders}</div>
              <p className="text-xs text-muted-foreground">
                of {traders.length} total traders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTrades}</div>
              <p className="text-xs text-muted-foreground">
                All time executions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Performance</CardTitle>
              {totalDailyPnL >= 0 ? (
                <TrendingUp className="h-4 w-4 text-profit" />
              ) : (
                <TrendingDown className="h-4 w-4 text-loss" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                totalDailyPnL >= 0 ? 'text-profit' : 'text-loss'
              }`}>
                {totalDailyPnL >= 0 ? '+' : ''}
                {((totalDailyPnL / totalBalance) * 100).toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Today's performance
              </p>
            </CardContent>
          </Card>
        </div>

        {traders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Trading Bots</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automated trading bot to get started
              </p>
              <CreateTrader onTraderCreated={handleTraderCreated} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Trading Bots ({traders.length})</CardTitle>
                <CardDescription>Select a bot to view details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {traders.map((trader) => (
                  <Button
                    key={trader.id}
                    variant={selectedTrader === trader.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTrader(trader.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 text-left">
                        <div className="font-medium">{trader.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ${trader.balance.toFixed(2)}
                        </div>
                      </div>
                      <Badge 
                        variant={trader.is_running ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {trader.is_running ? "ON" : "OFF"}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              {selectedTraderData ? (
                <TraderDashboard
                  traderId={selectedTraderData.id}
                  traderName={selectedTraderData.name}
                  onTraderDeleted={handleTraderDeleted}
                />
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Select a Trader</h3>
                    <p className="text-muted-foreground">
                      Choose a trading bot from the list to view its analytics
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
