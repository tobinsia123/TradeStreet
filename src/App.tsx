import { useState } from 'react';
import { useMarket } from './hooks/useMarket';
import { StockCard } from './components/StockCard';
import { StockChart } from './components/StockChart';
import { TradePanel } from './components/TradePanel';
import { NewsFeed } from './components/NewsFeed';
import { PortfolioSummary } from './components/PortfolioSummary';
// types imported where needed; no direct imports here
import AuthButton from './components/AuthButton';

function App() {
  const { state, isLoading, error, handleBuy, handleSell } = useMarket();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400 font-mono text-xl">Loading TradeStreet...</div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 font-mono text-xl">
          {error || 'Failed to initialize market'}
        </div>
      </div>
    );
  }

  const selectedCompany = selectedTicker
    ? state.companies.find((c) => c.ticker === selectedTicker) ?? null
    : null;

  const selectedPrice = selectedTicker ? state.prices[selectedTicker] : 0;
  const selectedPriceHistory = selectedTicker
    ? state.priceHistory[selectedTicker] || []
    : [];

  // Calculate price changes for display
  const getPriceChange = (ticker: string) => {
    const history = state.priceHistory[ticker] || [];
    if (history.length < 2) return { change: 0, percent: 0 };
    const current = history[history.length - 1].price;
    const previous = history[history.length - 2].price;
    const change = current - previous;
    const percent = previous !== 0 ? (change / previous) * 100 : 0;
    return { change, percent };
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-green-400">TradeStreet</h1>
              <p className="text-gray-400 text-sm">AI Synthetic Market</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <div className="text-gray-400 text-sm">Market Status</div>
                <div className="text-green-400 font-bold">● LIVE</div>
              </div>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Stock List */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <h2 className="text-white font-bold mb-2">Markets</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {state.companies.map((company) => {
                  const { change, percent } = getPriceChange(company.ticker);
                  return (
                    <StockCard
                      key={company.ticker}
                      company={company}
                      currentPrice={state.prices[company.ticker]}
                      priceChange={change}
                      priceChangePercent={percent}
                      onClick={() => setSelectedTicker(company.ticker)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Column: Chart and Trade Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <div className="bg-gray-900 border border-gray-700 rounded p-4">
              {selectedCompany ? (
                <>
                  <div className="mb-4">
                    <div className="text-white font-bold text-lg">
                      {selectedCompany.ticker} - {selectedCompany.name}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {selectedCompany.description}
                    </div>
                  </div>
                  <StockChart
                    key={selectedCompany.ticker}
                    priceHistory={selectedPriceHistory}
                    ticker={selectedCompany.ticker}
                  />
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Select a stock to view chart
                </div>
              )}
            </div>

            {/* Trade Panel */}
            <TradePanel
              selectedCompany={selectedCompany}
              currentPrice={selectedPrice}
              portfolio={state.portfolio}
              onBuy={handleBuy}
              onSell={handleSell}
            />
          </div>

          {/* Right Column: Portfolio and News */}
          <div className="lg:col-span-1 space-y-6">
            <PortfolioSummary
              portfolio={state.portfolio}
              prices={state.prices}
            />
            <div className="h-[400px]">
              <NewsFeed news={state.news} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

