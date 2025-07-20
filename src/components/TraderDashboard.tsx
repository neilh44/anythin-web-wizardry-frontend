import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Trash2, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { tradingAPI, type TradeEntry, type PerformanceMetrics } from '@/services/api';
import { TradeHistory } from './TradeHistory';
import { PerformanceChart } from './PerformanceChart';
import { TechnicalIndicators } from './TechnicalIndicators';
import { TraderControls } from './TraderControls';
import { useToast } from '@/hooks/use-toast';

interface TraderDashboardProps {
  traderId: string;
  traderName: string;
  onTraderDeleted: () => void;
}

export function TraderDashboard({ traderId, traderName, onTraderDeleted }: TraderDashboardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTraderData();
    const interval = setInterval(loadTraderData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [traderId]);

  const loadTraderData = async () => {
    try {
      const [statusData, tradesData, performanceData] = await Promise.all([
        tradingAPI.getTraderStatus(traderId),
        tradingAPI.getTraderTrades(traderId),
        tradingAPI.getTraderPerformance(traderId),
      ]);

      setIsRunning(statusData.is_running);
      setTrades(tradesData);
      setPerformance(performanceData);
    } catch (error) {
      console.error('Error loading trader data:', error);
    }
  };

  const handleStartStop = async () => {
    setLoading(true);
    try {
      if (isRunning) {
        await tradingAPI.stopTrader(traderId);
        toast({
          title: "Trader Stopped",
          description: `${traderName} has been stopped successfully.`,
        });
      } else {
        await tradingAPI.startTrader(traderId);
        toast({
          title: "Trader Started",
          description: `${traderName} is now running.`,
        });
      }
      await loadTraderData();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isRunning ? 'stop' : 'start'} trader.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${traderName}?`)) return;
    
    try {
      await tradingAPI.deleteTrader(traderId);
      toast({
        title: "Trader Deleted",
        description: `${traderName} has been deleted successfully.`,
      });
      onTraderDeleted();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete trader.",
        variant: "destructive",
      });
    }
  };

  const openTrades = trades.filter(trade => trade.trade_status === 'OPEN');
  const closedTrades = trades.filter(trade => trade.trade_status !== 'OPEN');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{traderName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isRunning ? "default" : "secondary"}>
              {isRunning ? "Running" : "Stopped"}
            </Badge>
            <span className="text-muted-foreground text-sm">ID: {traderId}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleStartStop}
            disabled={loading}
            variant={isRunning ? "destructive" : "default"}
          >
            {isRunning ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isRunning ? "Stop" : "Start"}
          </Button>
          <Button onClick={handleDelete} variant="outline" size="icon">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${performance.current_balance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                P&L: ${performance.total_pnl.toFixed(2)} ({performance.total_pnl_pct.toFixed(2)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(performance.win_rate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {performance.winning_trades}W / {performance.losing_trades}L
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performance.profit_factor.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Avg Win: ${performance.avg_win.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-loss">
                {(performance.max_drawdown * 100).toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Sharpe: {performance.sharpe_ratio.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="trades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trades">Trades ({trades.length})</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="indicators">Indicators</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="trades" className="space-y-4">
          {openTrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Open Positions ({openTrades.length})</CardTitle>
                <CardDescription>Currently active trades</CardDescription>
              </CardHeader>
              <CardContent>
                <TradeHistory trades={openTrades} showStatus={false} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Trade History ({closedTrades.length})</CardTitle>
              <CardDescription>All completed trades</CardDescription>
            </CardHeader>
            <CardContent>
              <TradeHistory trades={closedTrades} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceChart trades={trades} performance={performance} />
        </TabsContent>

        <TabsContent value="indicators">
          <TechnicalIndicators traderId={traderId} />
        </TabsContent>

        <TabsContent value="controls">
          <TraderControls traderId={traderId} onUpdate={loadTraderData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}