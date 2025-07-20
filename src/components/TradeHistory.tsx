import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type TradeEntry } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TradeHistoryProps {
  trades: TradeEntry[];
  showStatus?: boolean;
}

export function TradeHistory({ trades, showStatus = true }: TradeHistoryProps) {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="default">Open</Badge>;
      case 'CLOSED_WIN':
        return <Badge className="bg-profit text-white">Win</Badge>;
      case 'CLOSED_LOSS':
        return <Badge className="bg-loss text-white">Loss</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSideBadge = (side: string) => {
    return (
      <Badge variant={side === 'LONG' ? 'default' : 'secondary'} className="gap-1">
        {side === 'LONG' ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        {side}
      </Badge>
    );
  };

  const getROEColor = (roe: number) => {
    if (roe > 0) return 'text-profit';
    if (roe < 0) return 'text-loss';
    return 'text-neutral';
  };

  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No trades to display
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Entry Price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Leverage</TableHead>
            <TableHead>Current ROE</TableHead>
            <TableHead>Max ROE</TableHead>
            <TableHead>Drawdown</TableHead>
            {showStatus && <TableHead>Status</TableHead>}
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.trade_id}>
              <TableCell className="font-medium">{trade.symbol}</TableCell>
              <TableCell>{getSideBadge(trade.side)}</TableCell>
              <TableCell>{formatCurrency(trade.entry_price)}</TableCell>
              <TableCell>{trade.quantity.toFixed(4)}</TableCell>
              <TableCell>{trade.leverage}x</TableCell>
              <TableCell className={getROEColor(trade.current_roe)}>
                {formatPercent(trade.current_roe)}
              </TableCell>
              <TableCell className={getROEColor(trade.max_roe)}>
                {formatPercent(trade.max_roe)}
              </TableCell>
              <TableCell className="text-loss">
                {formatPercent(trade.drawdown)}
              </TableCell>
              {showStatus && (
                <TableCell>{getStatusBadge(trade.trade_status)}</TableCell>
              )}
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}