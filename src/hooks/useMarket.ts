import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketState, PricePoint } from '../types/market';
import { generateCompanies } from '../api/generateCompanies';
import { generateNews } from '../api/generateNews';
import { calculateNewPrice, initializePriceHistory } from '../utils/priceEngine';
import { getInitialPortfolio, buyStock, sellStock } from '../utils/portfolio';

const TICK_INTERVAL = 4000; // 4 seconds
const NEWS_INTERVAL = 30000; // 30 seconds

export function useMarket() {
  const [state, setState] = useState<MarketState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const lastNewsTimeRef = useRef<number>(0);
  const tickIntervalRef = useRef<number | null>(null);

  // Initialize market
  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);
        const companies = await generateCompanies(8);
        const portfolio = getInitialPortfolio();
        
        const prices: Record<string, number> = {};
        const priceHistory: Record<string, PricePoint[]> = {};
        
        companies.forEach((company) => {
          prices[company.ticker] = company.basePrice;
          priceHistory[company.ticker] = initializePriceHistory(
            company.ticker,
            company.basePrice
          );
        });
        
        setState({
          companies,
          prices,
          priceHistory,
          news: [],
          portfolio,
        });
        
        lastNewsTimeRef.current = Date.now();
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize market');
        setIsLoading(false);
      }
    }
    
    initialize();
  }, []);

  // Market tick loop
  useEffect(() => {
    if (!state) return;
    
    tickIntervalRef.current = window.setInterval(() => {
      setState((prevState) => {
        if (!prevState) return prevState;
        
        const now = Date.now();
        const newPrices: Record<string, number> = {};
        const newPriceHistory: Record<string, PricePoint[]> = {};
        
        // Update prices for all companies
        prevState.companies.forEach((company) => {
          const currentPrice = prevState.prices[company.ticker];
          const newPrice = calculateNewPrice(
            currentPrice,
            company,
            prevState.news
          );
          
          newPrices[company.ticker] = newPrice;
          
          // Append to price history (keep last 100 points)
          const history = [...prevState.priceHistory[company.ticker]];
          history.push({
            ticker: company.ticker,
            price: newPrice,
            timestamp: now,
          });
          
          if (history.length > 100) {
            history.shift();
          }
          
          newPriceHistory[company.ticker] = history;
        });
        
        return {
          ...prevState,
          prices: newPrices,
          priceHistory: newPriceHistory,
        };
      });
    }, TICK_INTERVAL);
    
    return () => {
      if (tickIntervalRef.current !== null) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [state]);

  // News generation loop - generate immediately and then on interval
  const newsIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!state) return;
    
    // Only initialize news generation once
    if (newsIntervalRef.current !== null) return;
    
    // Capture companies once at initialization
    const companies = state.companies;
    
    // Generate news function
    const generateAndUpdateNews = async () => {
      try {
        const newsEvents = await generateNews(companies, Math.floor(Math.random() * 3) + 1);
        
        if (newsEvents.length > 0) {
          setState((prevState) => {
            if (!prevState) return prevState;
            
            // Keep last 50 news items
            const updatedNews = [...prevState.news, ...newsEvents];
            if (updatedNews.length > 50) {
              updatedNews.splice(0, updatedNews.length - 50);
            }
            
            return {
              ...prevState,
              news: updatedNews,
            };
          });
        }
      } catch (err) {
        console.error('Error generating news:', err);
      }
    };
    
    // Generate news immediately
    generateAndUpdateNews();
    
    // Then generate news on interval
    newsIntervalRef.current = window.setInterval(generateAndUpdateNews, NEWS_INTERVAL);
    
    return () => {
      if (newsIntervalRef.current !== null) {
        clearInterval(newsIntervalRef.current);
        newsIntervalRef.current = null;
      }
    };
  }, [!!state]); // Only depend on whether state exists (boolean)

  const handleBuy = useCallback((ticker: string, shares: number) => {
    if (!state) return;
    
    try {
      const price = state.prices[ticker];
      const newPortfolio = buyStock(state.portfolio, ticker, shares, price);
      
      setState({
        ...state,
        portfolio: newPortfolio,
      });
    } catch (err) {
      throw err;
    }
  }, [state]);

  const handleSell = useCallback((ticker: string, shares: number) => {
    if (!state) return;
    
    try {
      const price = state.prices[ticker];
      const newPortfolio = sellStock(state.portfolio, ticker, shares, price);
      
      setState({
        ...state,
        portfolio: newPortfolio,
      });
    } catch (err) {
      throw err;
    }
  }, [state]);

  return {
    state,
    isLoading,
    error,
    handleBuy,
    handleSell,
  };
}

