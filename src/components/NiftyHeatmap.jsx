import React, { useState, useEffect } from 'react';

const NiftyHeatmap = () => {
  const [data, setData] = useState(null);
  const [yearlyReturns, setYearlyReturns] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDebugInfo('Starting data fetch...\n');
        
        // Read the JSON file from the data directory
        const response = await window.fs.readFile('data/nifty_returns.json');
        setDebugInfo(prev => prev + 'File read successful\n');
        
        // Decode and parse the JSON
        const textContent = new TextDecoder().decode(response);
        setDebugInfo(prev => prev + `Raw JSON content (first 100 chars): ${textContent.substring(0, 100)}...\n`);
        
        const jsonData = JSON.parse(textContent);
        setDebugInfo(prev => prev + 'JSON parsing successful\n');
        setData(jsonData);
        
        // Calculate yearly returns with detailed logging
        const yearlyData = {};
        let sampleCalculation = '';
        
        Object.entries(jsonData).forEach(([year, months]) => {
          const monthlyReturns = Object.values(months);
          let yearReturn = 1;
          
          // Log detailed calculation for 2023 as a sample
          if (year === '2023') {
            sampleCalculation = `\nDetailed calculation for 2023:\n`;
            monthlyReturns.forEach((monthReturn, idx) => {
              yearReturn *= (1 + monthReturn/100);
              sampleCalculation += `Month ${idx + 1}: ${monthReturn}% -> Running total: ${((yearReturn - 1) * 100).toFixed(2)}%\n`;
            });
          }
          
          yearlyData[year] = ((yearReturn - 1) * 100).toFixed(2);
        });
        
        setDebugInfo(prev => prev + '\nYearly returns calculated' + sampleCalculation);
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
        setError(`${error.message}\nStack: ${error.stack}`);
        setDebugInfo(prev => prev + `\nError occurred: ${error.message}\nStack: ${error.stack}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-lg mb-4">Loading data...</div>
      <pre className="text-sm bg-gray-100 p-4 rounded-lg whitespace-pre-wrap max-w-2xl">
        {debugInfo}
      </pre>
    </div>
  );
  
  if (error) return (
    <div className="p-4">
      <div className="text-red-600 mb-4">Error loading data: {error}</div>
      <pre className="text-sm bg-gray-100 p-4 rounded-lg whitespace-pre-wrap max-w-2xl">
        Debug Information:
        {debugInfo}
      </pre>
    </div>
  );

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Object.keys(data).sort((a, b) => b - a);
  
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
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">NIFTY Monthly Returns Heatmap</h2>
          <p className="text-gray-600">Monthly percentage returns of NIFTY index over time</p>
        </div>

        {/* Debug Panel */}
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-gray-600">Debug Information</summary>
          <pre className="mt-2 text-xs bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">
            Data loaded: {data ? 'Yes' : 'No'}
            Yearly returns calculated: {Object.keys(yearlyReturns).length > 0 ? 'Yes' : 'No'}
            Sample yearly returns: {JSON.stringify(yearlyReturns, null, 2)}
            Debug log:
            {debugInfo}
          </pre>
        </details>

        {/* Controls & Stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
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
                <th className="p-2 border bg-gray-100 font-semibold text-gray-700 w-24">
                  Year Total
                </th>
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
                  <td 
                    className={`p-2 border text-center font-semibold ${getColor(parseFloat(yearlyReturns[year]))}`}
                  >
                    {yearlyReturns[year] !== undefined ? `${yearlyReturns[year]}%` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hover Tooltip */}
        {hoveredCell && (
          <div className="fixed bg-white p-3 rounded-lg shadow-lg border text-sm">
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