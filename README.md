# TradeStreet

An AI-powered synthetic stock market environment where AI-generated company news and sentiment dynamically move asset prices.

## 🚀 Features

- **Synthetic Companies**: AI-generated fictional companies with realistic profiles
- **AI News Engine**: Claude generates news events with sentiment and magnitude values every 30 seconds
- **Real-Time Price Movement**: Prices update every 4 seconds based on sentiment, volatility, and random drift
- **Trading Engine**: Buy and sell stocks with virtual cash ($100,000 starting balance)
- **Portfolio Tracking**: Real-time portfolio value and P&L calculations
- **Live Charts**: Price history visualization using lightweight-charts
- **Web3 Wallet Integration**: Connect MetaMask or other wallets on Base network
- **TradeCoin (TCO) Balance**: Display your TCO token balance from Base network
- **Terminal UI**: Minimalist trading terminal interface

## 🛠 Tech Stack

- React 18 + Vite + TypeScript
- Tailwind CSS for styling
- lightweight-charts for candlestick charts
- wagmi + viem for Web3 wallet connectivity
- Base network support
- Claude API for AI generation
- LocalStorage for state persistence

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd TradeStreet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```bash
VITE_CLAUDE_API_KEY=your_claude_api_key_here
VITE_TCO_TOKEN_ADDRESS=0xYourTCOContractAddressOnBase
```

- Get a Claude API key from [Anthropic](https://console.anthropic.com/)
- Set `VITE_TCO_TOKEN_ADDRESS` to your TradeCoin (TCO) token contract address on Base network

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## 🎮 Usage

1. **View Markets**: Browse the list of synthetic companies on the left
2. **Select a Stock**: Click on any stock card to view its chart and details
3. **Trade**: Use the trade panel to buy or sell shares
4. **Monitor News**: Watch the news feed for AI-generated market events
5. **Track Portfolio**: View your cash balance, positions, and P&L in the portfolio summary

## 📁 Project Structure

```
src/
 ├─ api/
 │   ├─ claude.ts              # Claude API client
 │   ├─ generateCompanies.ts   # Company generation logic
 │   └─ generateNews.ts        # News generation logic
 ├─ hooks/
 │   └─ useMarket.ts           # Market simulation hook
 ├─ utils/
 │   ├─ priceEngine.ts         # Price calculation logic
 │   └─ portfolio.ts           # Trading and portfolio management
 ├─ components/
 │   ├─ StockCard.tsx          # Stock list item component
 │   ├─ StockChart.tsx         # Price chart component
 │   ├─ TradePanel.tsx         # Trading interface
 │   ├─ NewsFeed.tsx           # News display component
 │   └─ PortfolioSummary.tsx  # Portfolio overview
 ├─ types/
 │   └─ market.ts              # TypeScript type definitions
 ├─ App.tsx                    # Main application component
 └─ main.tsx                   # Application entry point
```

## 🔧 Configuration

- **Market Tick Interval**: 4 seconds (configurable in `src/hooks/useMarket.ts`)
- **News Generation Interval**: 30 seconds (configurable in `src/hooks/useMarket.ts`)
- **Initial Cash**: $100,000 (configurable in `src/utils/portfolio.ts`)
- **Price History Length**: Last 100 price points per stock
- **News History Length**: Last 50 news events

## 📝 Notes

- All trading data is persisted in localStorage
- The market continues to run even if news generation fails (falls back to price drift only)
- If Claude API is unavailable, the app uses default companies
- Prices are calculated deterministically using volatility, sentiment, and random drift

## 🚧 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📄 License

See LICENSE file for details.
