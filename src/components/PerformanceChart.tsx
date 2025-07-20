import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { type TradeEntry, type PerformanceMetrics } from '@/services/api';
import { useMemo } from 'react';

interface PerformanceChartProps {
  trades: TradeEntry[];
  performance: PerformanceMetrics | null;
}

export function PerformanceChart({ trades, performance }: PerformanceChartProps) {
  const equityCurve = useMemo(() => {
    if (!trades.length || !performance) return [];
    
    let balance = performance.current_balance - performance.total_pnl;
    const curve = [{ time: 'Start', balance, pnl: 0 }];
    
    const closedTrades = trades
      .filter(trade => trade.trade_status !== 'OPEN')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    closedTrades.forEach((trade, index) => {
      const pnl = trade.actual_return_pct ? (trade.actual_return_pct / 100) * balance : 0;
      balance += pnl;
      curve.push({
        time: `Trade ${index + 1}`,
        balance,
        pnl: pnl,
        symbol: trade.symbol,
        side: trade.side
      });
    });
    
    return curve;
  }, [trades, performance]);

  const symbolPerformance = useMemo(() => {
    const symbolStats: Record<string, { wins: number; losses: number; totalPnL: number }> = {};
    
    trades.filter(t => t.trade_status !== 'OPEN').forEach(trade => {
      if (!symbolStats[trade.symbol]) {
        symbolStats[trade.symbol] = { wins: 0, losses: 0, totalPnL: 0 };
      }
      
      if (trade.trade_status === 'CLOSED_WIN') {
        symbolStats[trade.symbol].wins++;
      } else {
        symbolStats[trade.symbol].losses++;
      }
      
      symbolStats[trade.symbol].totalPnL += trade.actual_return_pct || 0;
    });
    
    return Object.entries(symbolStats).map(([symbol, stats]) => ({
      symbol,
      ...stats,
      total: stats.wins + stats.losses,
      winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0
    }));
  }, [trades]);

  const dailyPnL = useMemo(() => {
    const dailyStats: Record<string, number> = {};
    
    trades.filter(t => t.trade_status !== 'OPEN' && t.exit_timestamp).forEach(trade => {
      const date = new Date(trade.exit_timestamp!).toDateString();
      if (!dailyStats[date]) dailyStats[date] = 0;
      dailyStats[date] += trade.actual_return_pct || 0;
    });
    
    return Object.entries(dailyStats)
      .map(([date, pnl]) => ({ date, pnl }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trades]);

  const roeDistribution = useMemo(() => {
    const closedTrades = trades.filter(t => t.trade_status !== 'OPEN');
    const wins = closedTrades.filter(t => t.trade_status === 'CLOSED_WIN').length;
    const losses = closedTrades.filter(t => t.trade_status === 'CLOSED_LOSS').length;
    
    return [
      { name: 'Wins', value: wins, color: 'hsl(var(--profit))' },
      { name: 'Losses', value: losses, color: 'hsl(var(--loss))' }
    ];
  }, [trades]);

  const COLORS = ['hsl(var(--profit))', 'hsl(var(--loss))'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Equity Curve */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
          <CardDescription>Portfolio balance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
                labelFormatter={(label) => `Trade: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Symbol Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Symbol Performance</CardTitle>
          <CardDescription>Win rate by trading symbol</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={symbolPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="symbol" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
              />
              <Bar dataKey="winRate" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Win/Loss Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Win/Loss Distribution</CardTitle>
          <CardDescription>Trade outcome breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {roeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily P&L */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Daily P&L</CardTitle>
          <CardDescription>Daily profit and loss breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyPnL}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'P&L']}
              />
              <Bar 
                dataKey="pnl" 
                fill={(entry: any) => entry.pnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}