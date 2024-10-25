import React, { useState, useEffect } from 'react';

const NiftyHeatmap = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setDebugInfo(prev => prev + '\nAttempting to fetch data...');
        
        // Use the correct path to the data subdirectory
        try {
          const basePath = import.meta.env.BASE_URL || '/';
          const jsonPath = `${basePath}data/nifty_returns.json`; // Updated path
          setDebugInfo(prev => prev + `\nTrying to fetch from: ${jsonPath}`);
          
          const response = await fetch(jsonPath);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const jsonData = await response.json();
          setData(jsonData);
          setDebugInfo(prev => prev + '\nFetch successful!');
          
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
        } catch (fetchError) {
          setDebugInfo(prev => prev + `\nFetch error: ${fetchError.message}`);
          throw fetchError;
        }
      } catch (error) {
        console.error('Error details:', error);
        setError(error.message);
        setDebugInfo(prev => prev + '\nFinal error: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Show loading state with debug info
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen flex-col">
      <div className="text-lg mb-4">Loading data...</div>
      <pre className="text-sm text-gray-600 bg-gray-100 p-4 rounded max-w-2xl overflow-auto">
        {debugInfo}
      </pre>
    </div>
  );
  
  // Show error state with debug info and help text
  if (error) return (
    <div className="p-4">
      <div className="text-red-600 mb-4">Error loading data: {error}</div>
      <pre className="text-sm bg-gray-100 p-4 rounded max-w-2xl overflow-auto">
        {debugInfo}
      </pre>
      <div className="mt-4 text-gray-600">
        Please ensure:
        <ul className="list-disc ml-6 mt-2">
          <li>The JSON file exists in public/data/nifty_returns.json</li>
          <li>The file name is exactly "nifty_returns.json"</li>
          <li>The JSON content is valid</li>
        </ul>
      </div>
    </div>
  );

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Object.keys(data).sort((a, b) => b - a); // Sort years in descending order
  
  const filteredYears = yearFilter === 'all' ? years : years.filter(year => {
    if (yearFilter === 'recent') return parseInt(year) >= 2020;
    if (yearFilter === 'crisis') return ['2008', '2020'].includes(year);
    return true;
  });

  const getColor = (value) => {
    if (value === undefined) return 'bg-gray-100';
    if (value > 5) return 'bg-green-600 text-white';
    if (value > 2) return 'bg-green-500 text-white';
    if (value > 0) return 'bg-green-300';
    if (value > -2) return 'bg-red-300';
    if (value > -5) return 'bg-red-500 text-white';
    return 'bg-red-600 text-white';
  };

  const isSignificantEvent = (year, month) => {
    return (
      (year === '2008' && month === 'Oct') || // Financial Crisis
      (year === '2020' && month === 'Mar')    // COVID Crash
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">NIFTY Monthly Returns Heatmap</h2>
          <p className="text-gray-600">Monthly percentage returns of NIFTY index over time</p>
        </div>

        {/* Controls & Stats Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
          {/* Year Filter */}
          <div className="flex items-center space-x-4">
            <label className="text-gray-700 font-medium">Time Period:</label>
            <select 
              className="border rounded-md px-3 py-1.5 bg-white"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">All Years</option>
              <option value="recent">Recent (2020+)</option>
              <option value="crisis">Crisis Years</option>
            </select>
          </div>

          {/* Stats Display */}
          {stats && (
            <div className="flex flex-wrap gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Best Month: </span>
                <span className="font-semibold text-green-600">
                  {stats.best.month} {stats.best.year} ({stats.best.value.toFixed(2)}%)
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Worst Month: </span>
                <span className="font-semibold text-red-600">
                  {stats.worst.month} {stats.worst.year} ({stats.worst.value.toFixed(2)}%)
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Average Return: </span>
                <span className="font-semibold">{stats.average}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Color Legend */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="text-sm font-medium">Returns:</div>
          <div className="flex space-x-3 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-600 mr-1"></div>
              <span>&gt; 5%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 mr-1"></div>
              <span>2-5%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-300 mr-1"></div>
              <span>0-2%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-300 mr-1"></div>
              <span>0 to -2%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 mr-1"></div>
              <span>-2 to -5%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-600 mr-1"></div>
              <span>&lt; -5%</span>
            </div>
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 border bg-gray-50 font-semibold text-gray-700">Year</th>
                {months.map(month => (
                  <th key={month} className="p-2 border bg-gray-50 font-semibold text-gray-700 w-20">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredYears.map(year => (
                <tr key={year}>
                  <td className="p-2 border font-medium bg-gray-50 text-gray-700">{year}</td>
                  {months.map(month => {
                    const value = data[year]?.[month];
                    const isSignificant = isSignificantEvent(year, month);
                    return (
                      <td 
                        key={`${year}-${month}`}
                        className={`p-2 border text-center relative transition-all duration-150 
                          ${getColor(value)} 
                          ${isSignificant ? 'ring-2 ring-yellow-400' : ''}
                          hover:scale-105 hover:z-10 hover:shadow-lg`}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hover Tooltip */}
        {hoveredCell && hoveredCell.value !== undefined && (
          <div 
            className="fixed bg-white p-3 rounded-lg shadow-lg border text-sm"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
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

export default NiftyHeatmap;