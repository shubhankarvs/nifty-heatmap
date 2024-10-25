import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const NiftyHeatmap = () => {
  const [data, setData] = useState(null);
  const [yearlyReturns, setYearlyReturns] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await window.fs.readFile('data/nifty_returns.json');
        const jsonData = JSON.parse(new TextDecoder().decode(response));
        setData(jsonData);
        
        // Calculate yearly returns
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

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-lg">Loading data...</div>
    </div>
  );
  
  if (error) return (
    <div className="p-4 text-red-600">Error loading data: {error}</div>
  );

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Object.keys(data).sort((a, b) => b - a);
  
  const filteredYears = yearFilter === 'all' ? years : years.filter(year => {
    if (yearFilter === 'recent') return parseInt(year) >= 2020;
    if (yearFilter === 'crisis') return ['2008', '2020'].includes(year);
    return true;
  });

  const getColor = (value) => {
    if (value === undefined || value === null) return 'bg-gray-100';
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto bg-white shadow-sm">
        {/* Header Section - Always visible */}
        <div className="p-4 border-b">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">NIFTY Monthly Returns</h1>
          <p className="text-gray-600 text-sm sm:text-base">Monthly percentage returns of NIFTY index over time</p>
        </div>

        {/* Controls Section */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col space-y-3">
            {/* Time Period Selector */}
            <div className="flex items-center">
              <label className="text-gray-700 font-medium text-sm sm:text-base w-28">Time Period:</label>
              <select 
                className="flex-1 max-w-[200px] border rounded-lg px-3 py-2 bg-white text-sm sm:text-base"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="all">All Years</option>
                <option value="recent">Recent (2020+)</option>
                <option value="crisis">Crisis Years</option>
              </select>
            </div>

            {/* Key Statistics */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-1">Best:</span>
                  <span className="font-medium text-green-600">
                    {stats.best.month} {stats.best.year} ({stats.best.value.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-1">Worst:</span>
                  <span className="font-medium text-red-600">
                    {stats.worst.month} {stats.worst.year} ({stats.worst.value.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-1">Avg:</span>
                  <span className="font-medium">{stats.average}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Color Legend - Collapsible on mobile */}
        <div className="border-b">
          <button 
            onClick={() => setShowLegend(!showLegend)}
            className="w-full p-4 flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50"
          >
            <span className="font-medium">Color Legend</span>
            <ChevronDown className={`w-5 h-5 transform transition-transform ${showLegend ? 'rotate-180' : ''}`} />
          </button>
          
          {showLegend && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm bg-gray-50">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-600 mr-2"></div>
                <span>&gt; 5%</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 mr-2"></div>
                <span>2-5%</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-300 mr-2"></div>
                <span>0-2%</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-300 mr-2"></div>
                <span>0 to -2%</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 mr-2"></div>
                <span>-2 to -5%</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-600 mr-2"></div>
                <span>&lt; -5%</span>
              </div>
            </div>
          )}
        </div>

        {/* Heatmap Table with Horizontal Scroll */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 p-2 border font-semibold text-gray-700 text-sm">Year</th>
                  {months.map(month => (
                    <th key={month} className="p-2 border bg-gray-50 font-semibold text-gray-700 text-sm w-16">
                      {month}
                    </th>
                  ))}
                  <th className="p-2 border bg-gray-200 font-semibold text-gray-800 text-sm w-20">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredYears.map(year => (
                  <tr key={year}>
                    <td className="sticky left-0 z-10 bg-gray-50 p-2 border font-medium text-gray-700 text-sm">{year}</td>
                    {months.map(month => {
                      const value = data[year]?.[month];
                      const isSignificant = isSignificantEvent(year, month);
                      return (
                        <td 
                          key={`${year}-${month}`}
                          className={`p-2 border text-center text-sm relative
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
                    <td className={`p-2 border text-center font-semibold text-sm ${getColor(yearlyReturns[year])}`}>
                      {yearlyReturns[year]}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile-friendly tooltip */}
        {hoveredCell && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t shadow-lg text-center">
            <div className="font-medium">{hoveredCell.month} {hoveredCell.year}</div>
            <div className={hoveredCell.value >= 0 ? 'text-green-600' : 'text-red-600'}>
              Return: {hoveredCell.value.toFixed(2)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NiftyHeatmap;