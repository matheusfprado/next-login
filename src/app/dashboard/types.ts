export interface DashboardCrypto {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h?: number;
  image: string;
  total_volume?: number;
  sparkline_in_7d?: {
    price: number[];
  };
}
