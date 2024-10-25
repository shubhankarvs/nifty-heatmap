import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const NiftyHeatmap = () => {
  // State management - keeping original structure
  const [data, setData] = useState(null);
  const [yearlyReturns, setYearlyReturns] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [showLegend, setShowLegend] = useState(false);

  // Keep existing data fetching logic intact
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await window.fs.readFile('data/nifty_returns.json');
        const jsonData = JSON.parse(new TextDecoder().decode(response));
        setData(jsonData);
        
        // Calculate yearly returns - keeping your existing logic
        const yearlyData = {};
        Object.entries(jsonData).forEach(([year, months]) => {
          let yearValue = 100;
          Object.values(months).forEach(monthReturn => {
            yearValue = yearValue * (1 + monthReturn/100);
          });
          yearlyData[year] = (yearValue - 100).toFixed(2);
        });
        setYearlyReturns(yearlyData);
        
        // Calculate statistics
        const allReturns = [];
        Object.entries(jsonData).forEach(([year, months]) => {
          Object.entries(months).forEach(([month, value]) => {
            allReturns.push({ year, month, value });
          });
        });
        
        const sortedReturns = allReturns.sort((a, b) => b.value - a.value);
        setStats({
          best: sortedReturns[0],
          worst: sortedReturns[sortedReturns.length - 1],
          average: (allReturns.reduce((sum, item) => sum + item.value, 0) / allReturns.length).toFixed(2)
        });
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Loading and error states
  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-lg text-gray-600">Loading data...</div>
    </div>
  );
  
  if (error) return (
    <div className="p-6 text-red-600">Error loading data: {error}</div>
  );

  const years = Object.keys(data).sort((a, b) => b - a);
  
  const filteredYears = yearFilter === 'all' ? years : years.filter(year => {
    if (yearFilter === 'recent') return parseInt(year) >= 2020;
    if (yearFilter === 'crisis') return ['2008', '2020'].includes(year);
    return true;
  });

  // Keep your existing color logic
  const getColor = (value) => {
    if (value === undefined || value === null) return 'bg-gray-50';
    const numValue = parseFloat(value);
    if (numValue > 5) return 'bg-green-600 text-white';
    if (numValue > 2) return 'bg-green-500 text-white';
    if (numValue > 0) return 'bg-green-300';
    if (numValue > -2) return 'bg-red-300';
    if (numValue > -5) return 'bg-red-500 text-white';
    return 'bg-red-600 text-white';
  };

  const isSignificantEvent = (year, month) => {
    return (
      (year === '2008' && month === 'Oct') || // Financial Crisis
      (year === '2020' && month === 'Mar')    // COVID Crash
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">NIFTY Monthly Returns</h1>
          <p className="text-gray-600 mt-1">Monthly percentage returns of NIFTY index over time</p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Controls Section */}
        <div className="space-y-6 mb-8">
          {/* Time Period & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-gray-700 font-medium">Time Period:</label>
              <select 
                className="border rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="all">All Years</option>
                <option value="recent">Recent (2020+)</option>
                <option value="crisis">Crisis Years</option>
              </select>
            </div>

            {stats && (
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-gray-600">Best:</span>
                  <span className="ml-1 font-medium text-green-600">
                    {stats.best.month} {stats.best.year} ({stats.best.value.toFixed(2)}%)
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Worst:</span>
                  <span className="ml-1 font-medium text-red-600">
                    {stats.worst.month} {stats.worst.year} ({stats.worst.value.toFixed(2)}%)
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Average:</span>
                  <span className="ml-1 font-medium">{stats.average}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Color Legend - Collapsible */}
          <div className="border rounded-lg overflow-hidden">
            <button 
              onClick={() => setShowLegend(!showLegend)}
              className="w-full px-4 py-3 flex items-center justify-between text-sm hover:bg-gray-50"
            >
              <span className="font-medium text-gray-700">Color Legend</span>
              <ChevronDown className={`w-5 h-5 transform transition-transform ${showLegend ? 'rotate-180' : ''}`} />
            </button>
            
            {showLegend && (
              <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-6 gap-3 text-sm border-t bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600"></div>
                  <span>&gt; 5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500"></div>
                  <span>2-5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-300"></div>
                  <span>0-2%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-300"></div>
                  <span>0 to -2%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500"></div>
                  <span>-2 to -5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600"></div>
                  <span>&lt; -5%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gray-100 p-3 border-b font-semibold text-gray-700 text-sm">Year</th>
                {MONTHS.map(month => (
                  <th key={month} className="p-3 border-b bg-gray-100 font-semibold text-gray-700 text-sm w-16">
                    {month}
                  </th>
                ))}
                <th className="p-3 border-b bg-gray-200 font-semibold text-gray-800 text-sm w-20">
                  Year Total
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredYears.map(year => (
                <tr key={year}>
                  <td className="sticky left-0 z-10 bg-gray-100 p-3 border-b font-medium text-gray-700 text-sm">{year}</td>
                  {MONTHS.map(month => {
                    const value = data[year]?.[month];
                    const isSignificant = isSignificantEvent(year, month);
                    return (
                      <td 
                        key={`${year}-${month}`}
                        className={`p-3 border-b text-center text-sm relative transition-colors
                          ${getColor(value)} 
                          ${isSignificant ? 'ring-2 ring-yellow-400' : ''}`}
                        onClick={() => setHoveredCell({ year, month, value })}
                      >
                        {value !== undefined ? value.toFixed(2) : ''}
                        {isSignificant && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                        )}
                      </td>
                    );
                  })}
                  <td className={`p-3 border-b text-center font-semibold text-sm ${getColor(yearlyReturns[year])}`}>
                    {yearlyReturns[year]}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile-friendly tooltip */}
        {hoveredCell && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t shadow-lg text-center sm:w-64 sm:left-auto sm:right-4 sm:bottom-4 sm:rounded-lg">
            <div className="font-medium">{hoveredCell.month} {hoveredCell.year}</div>
            <div className={hoveredCell.value >= 0 ? 'text-green-600' : 'text-red-600'}>
              Return: {hoveredCell.value.toFixed(2)}%
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NiftyHeatmap;