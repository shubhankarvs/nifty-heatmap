import React, { useState, useEffect } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const NiftyHeatmap = () => {
  const [data, setData] = useState(null);
  const [yearlyReturns, setYearlyReturns] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [yearFilter, setYearFilter] = useState('all');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('data/nifty_returns.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setData(jsonData);
        
        // Calculate yearly returns - Fixed calculation
        const yearlyData = {};
        Object.entries(jsonData).forEach(([year, months]) => {
          // Start with base value of 100
          let yearValue = 100;
          
          // Apply each month's return compounded
          Object.values(months).forEach(monthReturn => {
            if (monthReturn !== undefined && monthReturn !== null) {
              yearValue *= (1 + monthReturn/100);
            }
          });
          
          // Convert final value to percentage return
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!data && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-lg">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600">Error loading data: {error}</div>
      </div>
    );
  }

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

 return (
    <div className="min-h-screen bg-white p-8">
      {/* Main Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">NIFTY Monthly Returns Heatmap</h1>
        <p className="text-gray-600 mt-1">Monthly percentage returns of NIFTY index over time</p>
      </div>

      {/* Controls and Stats Row */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Time Period Filter and Stats */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Time Period:</span>
            <select 
              className="border rounded px-2 py-1 min-w-[120px]"
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
                Best Month: <span className="text-green-600">May 2009 (28.07%)</span>
              </div>
              <div>
                Worst Month: <span className="text-red-600">Oct 2008 (-26.41%)</span>
              </div>
              <div>
                Average Return: <span>{stats.average}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-gray-700">Returns:</span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-600"></div>
              <span>{'>'}5%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-500"></div>
              <span>2-5%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-300"></div>
              <span>0-2%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-300"></div>
              <span>0 to -2%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500"></div>
              <span>-2 to -5%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-600"></div>
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
                  return (
                    <td 
                      key={`${year}-${month}`}
                      className={`border-b p-2 text-center ${getColor(value)}`}
                      onMouseEnter={() => setHoveredCell({ year, month, value })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {value !== undefined ? value.toFixed(2) : ''}
                    </td>
                  );
                })}
                <td className={`border-b p-2 text-center font-medium ${getColor(parseFloat(yearlyReturns[year]))}`}>
                  {yearlyReturns[year] !== undefined ? `${yearlyReturns[year]}%` : '%'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {hoveredCell && hoveredCell.value !== undefined && (
        <div 
          className="fixed bg-white p-2 rounded shadow-lg border text-sm"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 50
          }}
        >
          <div className="font-medium">{hoveredCell.month} {hoveredCell.year}</div>
          <div className={hoveredCell.value >= 0 ? 'text-green-600' : 'text-red-600'}>
            {hoveredCell.value.toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default NiftyHeatmap;