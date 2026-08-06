import { GlobalSearchService } from './global-search.service';
import { SearchIndex } from './search.models';

describe('GlobalSearchService', () => {
  const service = new GlobalSearchService();
  const index: SearchIndex = {
    customers: [{ customerId: 104, customerName: 'Rahul Sharma', emailAddress: 'rahul@example.com' }],
    stocks: [{ stockSymbol: 'ORCL', stockName: 'Oracle Corporation', currentPrice: 125, availableQuantity: 120 }],
    transactions: [],
    portfolios: [{ customerId: 104, customerName: 'Rahul Sharma', holdings: [], totalAssetValue: 1989.2 }],
    partiallyUnavailable: false,
  };

  it('finds a stock despite a small spelling mistake', () => {
    const results = service.search('orcle', index, []);
    expect(results.some((result) => result.id === 'stock-ORCL')).toBe(true);
  });

  it('supports category prefixes', () => {
    const results = service.search('customer: rah', index, []);
    expect(results).toHaveLength(1);
    expect(results[0].category).toBe('customers');
  });
});
