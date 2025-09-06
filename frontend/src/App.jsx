import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// API URL for the backend
const API_URL = "http://localhost:3001/api/cash-entries";

const App = () => {
  // State variables to hold data
  const [entries, setEntries] = useState([]);
  const [cashierName, setCashierName] = useState('');
  const [counterNumber, setCounterNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApiReady, setIsApiReady] = useState(false);
  
  // State for the denomination counts
  const [counts, setCounts] = useState({
    notes: {
      "₹500": 0, "₹200": 0, "₹100": 0, "₹50": 0, "₹20": 0, "₹10": 0
    },
    coins: {
      "₹10": 0, "₹5": 0, "₹2": 0, "₹1": 0
    }
  });

  // Use useCallback to memoize the function and prevent re-creation on every render.
  const checkApiStatus = useCallback(async () => {
    try {
      await axios.get(API_URL);
      setIsApiReady(true);
      console.log('Backend API is ready.');
    } catch (error) {
      setIsApiReady(false);
      console.error("Backend API is not running. Please start the server.");
    }
  }, []); 

  // Use useCallback to memoize the function and prevent re-creation on every render.
  const fetchEntries = useCallback(async () => {
  if (!isApiReady) {
    console.warn("API is not ready. Skipping data fetch.");
    return;
  }
  setIsLoading(true);
  try {
    const response = await axios.get(API_URL);
    // ✅ No need to JSON.parse again, backend already did that
    setEntries(response.data);
  } catch (error) {
    console.error("Failed to fetch entries:", error);
  } finally {
    setIsLoading(false);
  }
}, [isApiReady]);

  // Handle form submission to add a new entry
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isApiReady) {
      console.error("API is not ready. Cannot submit data.");
      return;
    }

    // Calculate the total amount from the counts
    const totalAmount = Object.entries(counts.notes).reduce((sum, [denom, count]) => sum + (parseInt(denom.replace('₹', '')) * count), 0) +
      Object.entries(counts.coins).reduce((sum, [denom, count]) => sum + (parseInt(denom.replace('₹', '')) * count), 0);

    const newEntry = {
      cashierName,
      counterNumber,
      timestamp: new Date().toISOString(),
      denominations: counts,
      totalAmount
    };

    try {
      await axios.post(API_URL, newEntry);
      fetchEntries(); // Refresh the list of entries after submission
      // Reset the form fields
      setCashierName('');
      setCounterNumber('');
      setCounts({
        notes: { "₹500": 0, "₹200": 0, "₹100": 0, "₹50": 0, "₹20": 0, "₹10": 0 },
        coins: { "₹10": 0, "₹5": 0, "₹2": 0, "₹1": 0 }
      });
    } catch (error) {
      console.error("Failed to submit entry:", error);
    }
  };


  // useEffect hook to run once when the component mounts
  useEffect(() => {
    // Poll the API status every 3 seconds until it's ready
    const interval = setInterval(() => {
      if (!isApiReady) {
        checkApiStatus();
      } else {
        clearInterval(interval);
        fetchEntries();
      }
    }, 3000);
    return () => clearInterval(interval); // Cleanup function

  
  }, [isApiReady, fetchEntries, checkApiStatus]);

  // Calculate the total amount from the counts
  const currentTotal = Object.entries(counts.notes).reduce((sum, [denom, count]) => sum + (parseInt(denom.replace('₹', '')) * count), 0) +
    Object.entries(counts.coins).reduce((sum, [denom, count]) => sum + (parseInt(denom.replace('₹', '')) * count), 0);

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">Cash Counter</h1>

        {/* --- Cash Count Form --- */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4">Cash Count Entry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Cashier Name" className="border p-2 rounded w-full" value={cashierName} onChange={(e) => setCashierName(e.target.value)} required />
              <input type="text" placeholder="Counter Number" className="border p-2 rounded w-full" value={counterNumber} onChange={(e) => setCounterNumber(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Notes</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(counts.notes).map(([denom, count]) => (
                  <div key={denom} className="flex items-center space-x-2">
                    <label>{denom}:</label>
                    <input type="number" min="0" className="border p-1 rounded w-20 text-center"
                           value={count}
                           onChange={(e) => setCounts(prev => ({ ...prev, notes: { ...prev.notes, [denom]: parseInt(e.target.value) || 0 } }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Coins</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(counts.coins).map(([denom, count]) => (
                  <div key={denom} className="flex items-center space-x-2">
                    <label>{denom}:</label>
                    <input type="number" min="0" className="border p-1 rounded w-20 text-center"
                           value={count}
                           onChange={(e) => setCounts(prev => ({ ...prev, coins: { ...prev.coins, [denom]: parseInt(e.target.value) || 0 } }))}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <div className="flex items-center space-x-2">
                <div className="text-xl font-bold">
                  Total: ₹{currentTotal.toLocaleString()}
                </div>
              </div>
              <button 
                type="submit" 
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Entry
              </button>
            </div>
          </form>
        </div>

        {/* --- Dashboard --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Entries</h2>
            <div className="flex space-x-2">
              <button 
                onClick={fetchEntries} 
                className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
          {!isApiReady ? (
            <div className="text-center py-8">
              <p className="text-red-500 font-bold">Backend API Not Connected</p>
              <p className="text-gray-500">Please start your Node.js server to use this application.</p>
            </div>
          ) : isLoading ? (
            <p className="text-center text-gray-500">Loading entries...</p>
          ) : entries.length === 0 ? (
            <p className="text-center text-gray-500">No entries recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{entry.cashierName}</h3>
                      <p className="text-sm text-gray-500">Counter: {entry.counterNumber}</p>
                      <p className="text-sm text-gray-500">Date: {new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">₹{entry.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium">Denominations:</p>
                    <div className="mt-4 pt-4 border-t">

  {/* Notes Section */}
  <div className="mb-3">
    <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Object.entries(entry.denominations.notes || {}).map(([denom, count]) => (
        <div key={denom} className="bg-blue-100 rounded-lg p-3 shadow-sm text-center">
          <p className="font-bold text-gray-800">{denom}</p>
          <p className="text-gray-600">{count} × {parseInt(denom.replace("₹",""))}</p>
          <p className="font-bold text-green-700">= ₹{count * parseInt(denom.replace("₹",""))}</p>
        </div>
      ))}
    </div>
  </div>

  {/* Coins Section */}
  <div>
    <h4 className="font-semibold text-gray-700 mb-2">Coins</h4>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Object.entries(entry.denominations.coins || {}).map(([denom, count]) => (
        <div key={denom} className="bg-yellow-100 rounded-lg p-3 shadow-sm text-center">
          <p className="font-bold text-gray-800">{denom}</p>
          <p className="text-gray-600">{count} × {parseInt(denom.replace("₹",""))}</p>
          <p className="font-bold text-green-700">= ₹{count * parseInt(denom.replace("₹",""))}</p>
        </div>
      ))}
    </div>
  </div>
</div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
