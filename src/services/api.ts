// API service for trading backend integration
const API_BASE_URL = 'http://localhost:5000';

export interface TradeEntry {
  trade_id: string;
  timestamp: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entry_price: number;
  quantity: number;
  leverage: number;
  risk_pct: number;
  reward_pct: number;
  stop_loss: number;
  take_profit: number;
  current_roe: number;
  drawdown: number;
  max_roe: number;
  trade_status: 'OPEN' | 'CLOSED_WIN' | 'CLOSED_LOSS';
  exit_price?: number;
  exit_timestamp?: string;
  actual_return_pct?: number;
  notes: string;
}

export interface TraderConfig {
  name: string;
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
}

export interface PerformanceMetrics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  max_drawdown: number;
  current_balance: number;
  total_pnl: number;
  total_pnl_pct: number;
  sharpe_ratio: number;
}

class TradingAPI {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Trader Management
  async createTrader(config: TraderConfig) {
    return this.request('/trader/create', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getTraders() {
    return this.request('/trader/list');
  }

  async getTraderStatus(traderId: string) {
    return this.request(`/trader/${traderId}/status`);
  }

  async startTrader(traderId: string) {
    return this.request(`/trader/${traderId}/start`, {
      method: 'POST',
    });
  }

  async stopTrader(traderId: string) {
    return this.request(`/trader/${traderId}/stop`, {
      method: 'POST',
    });
  }

  async deleteTrader(traderId: string) {
    return this.request(`/trader/${traderId}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getTraderTrades(traderId: string): Promise<TradeEntry[]> {
    return this.request(`/trader/${traderId}/trades`);
  }

  async getTraderPerformance(traderId: string): Promise<PerformanceMetrics> {
    return this.request(`/trader/${traderId}/performance`);
  }

  async exportTrades(traderId: string) {
    return this.request(`/trader/${traderId}/export`);
  }

  // Real-time data
  async getMarketData(symbol: string) {
    return this.request(`/market/data/${symbol}`);
  }

  async getTechnicalIndicators(traderId: string, symbol: string) {
    return this.request(`/trader/${traderId}/indicators/${symbol}`);
  }
}

export const tradingAPI = new TradingAPI();