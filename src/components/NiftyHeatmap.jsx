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
    <div className="min-h-screen bg-white p-8">
      {/* Header - More compact now */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">NIFTY Monthly Returns Heatmap</h1>
        <p className="text-gray-600 text-sm">Monthly percentage returns of NIFTY index over time</p>
      </div>

      {/* Controls and Stats - Single line */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Time Period:</span>
            <select 
              className="border rounded px-2 py-1 text-sm"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">All Years</option>
              <option value="recent">Recent (2020+)</option>
              <option value="crisis">Crisis Years</option>
            </select>
          </div>

          {stats && (
            <div className="flex items-center gap-6 text-sm">
              <div>
                Best Month: <span className="text-green-600">{stats.best.month} {stats.best.year} ({stats.best.value.toFixed(2)}%)</span>
              </div>
              <div>
                Worst Month: <span className="text-red-600">{stats.worst.month} {stats.worst.year} ({stats.worst.value.toFixed(2)}%)</span>
              </div>
              <div>
                Average Return: <span className="font-medium">{stats.average}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Color Legend - Inline */}
      <div className="mb-6">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-700">Returns:</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-600"></div>
              <span>{'>'}5%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500"></div>
              <span>2-5%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-300"></div>
              <span>0-2%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-300"></div>
              <span>0 to -2%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500"></div>
              <span>-2 to -5%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-600"></div>
              <span>{'<'}-5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse bg-white text-sm">
          <thead>
            <tr>
              <th className="border-b p-2 bg-gray-50 text-left font-medium text-gray-700 sticky left-0">Year</th>
              {MONTHS.map(month => (
                <th key={month} className="border-b p-2 bg-gray-50 font-medium text-gray-700 text-center">
                  {month}
                </th>
              ))}
              <th className="border-b p-2 bg-gray-50 font-medium text-gray-700 text-center">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredYears.map(year => (
              <tr key={year}>
                <td className="border-b p-2 font-medium text-gray-700 sticky left-0 bg-white">{year}</td>
                {MONTHS.map(month => {
                  const value = data[year]?.[month];
                  const isSignificant = isSignificantEvent(year, month);
                  return (
                    <td 
                      key={`${year}-${month}`}
                      className={`border-b p-2 text-center relative
                        ${getColor(value)} 
                        ${isSignificant ? 'ring-1 ring-yellow-400' : ''}`}
                    >
                      {value !== undefined ? value.toFixed(2) : ''}
                      {isSignificant && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                      )}
                    </td>
                  );
                })}
                <td className={`border-b p-2 text-center font-medium ${getColor(yearlyReturns[year])}`}>
                  {yearlyReturns[year]}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip - Only show on hover, not click */}
      {hoveredCell && (
        <div 
          className="fixed bg-white p-3 rounded shadow-lg border text-sm"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 50
          }}
        >
          <div className="font-medium text-gray-900">{hoveredCell.month} {hoveredCell.year}</div>
          <div className={hoveredCell.value >= 0 ? 'text-green-600' : 'text-red-600'}>
            {hoveredCell.value.toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default NiftyHeatmap;