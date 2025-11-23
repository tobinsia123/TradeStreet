import { NewsEvent, Company } from '../types/market';
import { callClaude } from './claude';

/**
 * Generate fallback news when API fails
 */
function generateFallbackNews(companies: Company[], count: number): NewsEvent[] {
  const newsTemplates = [
    {
      positive: [
        { headline: "Reports Strong Quarterly Earnings, Beats Estimates", sentiment: 0.8, magnitude: 0.7 },
        { headline: "Signs Major Partnership Deal Worth Millions", sentiment: 0.7, magnitude: 0.6 },
        { headline: "FDA Approves New Product for Market", sentiment: 0.9, magnitude: 0.8 },
        { headline: "Analyst Upgrades Stock to Buy Rating", sentiment: 0.6, magnitude: 0.5 },
        { headline: "Announces Breakthrough Innovation", sentiment: 0.85, magnitude: 0.75 },
      ],
      negative: [
        { headline: "Reports Earnings Miss, Stock Drops", sentiment: -0.7, magnitude: 0.7 },
        { headline: "Faces Regulatory Investigation", sentiment: -0.8, magnitude: 0.8 },
        { headline: "Product Recall Announced", sentiment: -0.9, magnitude: 0.9 },
        { headline: "Key Executive Resigns Unexpectedly", sentiment: -0.6, magnitude: 0.6 },
        { headline: "Loses Major Contract to Competitor", sentiment: -0.75, magnitude: 0.7 },
      ],
    },
  ];

  const now = Date.now();
  const news: NewsEvent[] = [];
  
  for (let i = 0; i < count && i < companies.length; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const isPositive = Math.random() > 0.5;
    const templates = isPositive 
      ? newsTemplates[0].positive 
      : newsTemplates[0].negative;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const bodyTemplates = [
      `The ${company.sector} sector company's stock is moving in response to market developments.`,
      `Investors are reacting to breaking news affecting the company's valuation.`,
      `Market analysts are closely watching the impact of this development.`,
      `The announcement is expected to significantly influence trading activity.`,
    ];
    
    news.push({
      ticker: company.ticker,
      headline: `${company.ticker}: ${template.headline}`,
      body: bodyTemplates[Math.floor(Math.random() * bodyTemplates.length)],
      sentiment: template.sentiment,
      magnitude: template.magnitude,
      timestamp: now + i * 100, // Slight offset for multiple news
    });
  }
  
  return news;
}

export async function generateNews(
  companies: Company[],
  count: number = 2
): Promise<NewsEvent[]> {
  const companyList = companies
    .map((c) => `${c.ticker} (${c.name} - ${c.sector})`)
    .join(', ');

  const prompt = `Generate ${count} realistic, impactful financial news events for these companies: ${companyList}

For each news event, provide:
- ticker: The stock ticker symbol of the affected company
- headline: A compelling news headline (max 80 characters) that would move stock prices
- body: A 1-2 sentence news story explaining the event and its market impact
- sentiment: A number between -1 and +1 (-1 = very negative, 0 = neutral, +1 = very positive)
- magnitude: A number between 0.3 and 1.0 (0.3 = moderate impact, 1.0 = major impact)

Generate news that would realistically cause stock price movements. Include:
- Earnings beats/misses, revenue surprises
- Product launches, FDA approvals, clinical trial results
- Major contracts, partnerships, acquisitions
- Regulatory changes, lawsuits, investigations
- Management changes, analyst upgrades/downgrades
- Market disruptions, competitive threats
- Breakthrough innovations, patent approvals

Make the news varied - mix positive and negative events. Use higher magnitude (0.6-1.0) for major events that would significantly move stock prices. 
Make headlines dramatic and newsworthy. Ensure sentiment accurately reflects the market impact.

Return ONLY a valid JSON array of objects with these exact fields. No markdown, no code blocks, just the JSON array.

Example format:
[
  {
    "ticker": "TECH",
    "headline": "TechNova Reports Record Q4 Earnings, Beats Estimates",
    "body": "The company exceeded analyst expectations with revenue growth of 35% year-over-year, driving strong after-hours trading.",
    "sentiment": 0.8,
    "magnitude": 0.7
  },
  {
    "ticker": "MEDI",
    "headline": "MediCore Drug Trial Fails Phase 3, Stock Plummets",
    "body": "The company's lead drug candidate failed to meet primary endpoints, raising concerns about pipeline viability.",
    "sentiment": -0.9,
    "magnitude": 0.9
  }
]`;

  try {
    const response = await callClaude(prompt);
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in Claude response');
    }
    const news: Omit<NewsEvent, 'timestamp'>[] = JSON.parse(jsonMatch[0]);
    
    // Add timestamps and validate
    const now = Date.now();
    return news
      .filter((n) => companies.some((c) => c.ticker === n.ticker))
      .slice(0, count)
      .map((n) => ({
        ...n,
        timestamp: now,
      }));
  } catch (error) {
    console.error('Error generating news from API, using fallback:', error);
    // Use fallback news generation if API fails
    return generateFallbackNews(companies, count);
  }
}

