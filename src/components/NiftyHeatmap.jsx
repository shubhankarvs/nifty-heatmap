import React, { useState, useEffect } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const App = () => {
  const [data, setData] = useState(null);
  const [yearlyReturns, setYearlyReturns] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Starting data load...');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDebugInfo(prev => prev + '\nAttempting to fetch data...');
        // Using BASE_URL to handle GitHub Pages path correctly
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/nifty_returns.json`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        setData(jsonData);
        setDebugInfo(prev => prev + '\nData parsed successfully');
        
        // Calculate yearly returns
        const yearlyData = {};
        Object.entries(jsonData).forEach(([year, months]) => {
          let yearValue = 100;
          Object.values(months).forEach(monthReturn => {
            if (monthReturn !== undefined && monthReturn !== null) {
              yearValue *= (1 + monthReturn/100);
            }
          });
          yearlyData[year] = (yearValue - 100).toFixed(2);
        });
        setYearlyReturns(yearlyData);
        
        // Calculate statistics
        const allReturns = [];
        Object.entries(jsonData).forEach(([year, months]) => {
          Object.entries(months).forEach(([month, value]) => {
            if (value !== undefined && value !== null) {
              allReturns.push({ year, month, value });
            }
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
        setDebugInfo(prev => prev + '\nError: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getColor = (value) => {
    if (value === undefined) return 'bg-gray-100';
    if (value > 5) return 'bg-green-600 text-white';
    if (value > 2) return 'bg-green-500 text-white';
    if (value > 0) return 'bg-green-300';
    if (value > -2) return 'bg-red-300';
    if (value > -5) return 'bg-red-500 text-white';
    return 'bg-red-600 text-white';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="space-y-2">
          <div className="text-lg">Loading NIFTY returns data...</div>
          <pre className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{debugInfo}</pre>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">Error loading data: {error}</div>
        <pre className="text-sm bg-gray-50 p-4 rounded">{debugInfo}</pre>
        <div className="mt-4 text-sm text-gray-600">
          Please check:
          <ul className="list-disc ml-6 mt-2">
            <li>The file exists at data/nifty_returns.json</li>
            <li>The JSON content is valid</li>
            <li>The server is responding correctly</li>
          </ul>
        </div>
      </div>
    );
  }

  const years = Object.keys(data).sort((a, b) => b - a);
  const filteredYears = yearFilter === 'all' ? years : years.filter(year => {
    if (yearFilter === 'recent') return parseInt(year) >= 2020;
    if (yearFilter === 'crisis') return ['2008', '2020'].includes(year);
    return true;
  });

  const isSignificantEvent = (year, month, value) => {
    const isLargeDrop = value !== undefined && value <= -15;
    const isMarketEvent = 
      (year === '2008' && month === 'Oct') || // Financial Crisis
      (year === '2020' && month === 'Mar');   // COVID Crash
    return isLargeDrop || isMarketEvent;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">NIFTY Monthly Returns Heatmap</h1>
          <p className="text-gray-600 mt-1">Monthly percentage returns of NIFTY index over time</p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Time Period:</span>
              <select 
                className="border rounded px-2 py-1"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="all">All Years</option>
                <option value="recent">Recent (2020+)</option>
                <option value="crisis">Crisis Years</option>
              </select>
            </div>

            {stats && (
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  Best Month: <span className="text-green-600 font-medium">{stats.best.month} {stats.best.year} ({stats.best.value.toFixed(2)}%)</span>
                </div>
                <div>
                  Worst Month: <span className="text-red-600 font-medium">{stats.worst.month} {stats.worst.year} ({stats.worst.value.toFixed(2)}%)</span>
                </div>
                <div>
                  Average Return: <span className="font-medium">{stats.average}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-gray-700">Returns:</span>
            {[
              { range: '>5%', color: 'bg-green-600' },
              { range: '2-5%', color: 'bg-green-500' },
              { range: '0-2%', color: 'bg-green-300' },
              { range: '0 to -2%', color: 'bg-red-300' },
              { range: '-2 to -5%', color: 'bg-red-500' },
              { range: '<-5%', color: 'bg-red-600' }
            ].map(({ range, color }) => (
              <div key={range} className="flex items-center gap-1">
                <div className={`w-4 h-4 ${color}`}></div>
                <span>{range}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white text-sm">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0 z-10">Year</th>
                {MONTHS.map(month => (
                  <th key={month} className="border p-2 bg-gray-50 font-medium text-gray-700 text-center whitespace-nowrap">
                    {month}
                  </th>
                ))}
                <th className="border p-2 bg-gray-100 font-medium text-gray-700 text-center whitespace-nowrap">
                  Year Total
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredYears.map(year => (
                <tr key={year}>
                  <td className="border p-2 font-medium text-gray-700 sticky left-0 bg-white z-10">{year}</td>
                  {MONTHS.map(month => {
                    const value = data[year]?.[month];
                    const isSignificant = isSignificantEvent(year, month, value);
                    return (
                      <td 
                        key={`${year}-${month}`}
                        className={`border p-2 text-center relative ${getColor(value)} 
                          ${isSignificant ? 'ring-2 ring-yellow-400' : ''}`}
                        onMouseEnter={() => setHoveredCell({ year, month, value })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {value !== undefined ? value.toFixed(2) : ''}
                        {isSignificant && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                        )}
                      </td>
                    );
                  })}
                  <td className={`border p-2 text-center font-medium ${getColor(parseFloat(yearlyReturns[year]))}`}>
                    {yearlyReturns[year]}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hoveredCell && hoveredCell.value !== undefined && (
          <div 
            className="fixed bg-white p-3 rounded-lg shadow-lg border text-sm"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 50
            }}
          >
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

export default App;