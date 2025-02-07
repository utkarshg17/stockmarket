import React, { useState } from "react";
import axios from "axios";

const API_KEY = "adf6fa403c592f828551e79ddf07bda6"; // Replace with process.env.MARKETSTACK_API_KEY in production
const BASE_URL = "http://api.marketstack.com/v1/eod";

const StockMarketFetcher = () => {
    const [symbol, setSymbol] = useState(""); // Stock symbol input
    const [stockData, setStockData] = useState(null);
    const [historicalData, setHistoricalData] = useState([]); // Historical stock data
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState("1week"); // Default time range

    // Get the correct date range based on selected time period
    const getStartDate = () => {
        const today = new Date();
        let startDate = new Date();

        switch (timeRange) {
            case "1week":
                startDate.setDate(today.getDate() - 7);
                break;
            case "1month":
                startDate.setMonth(today.getMonth() - 1);
                break;
            case "1year":
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            case "5years":
                startDate.setFullYear(today.getFullYear() - 5);
                break;
            default:
                startDate.setDate(today.getDate() - 7);
        }

        return startDate.toISOString().split("T")[0]; // Format YYYY-MM-DD
    };

    // Fetch latest stock data
    const fetchStockData = async () => {
        if (!symbol) return alert("Enter a stock symbol!");
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    access_key: API_KEY,
                    symbols: `${symbol}.XNSE`,
                    limit: 1, // Latest data
                },
            });

            setStockData(response.data.data[0]); // Store latest stock data
        } catch (err) {
            setError("Failed to fetch stock data. Try again.");
            console.error(err);
        }

        setLoading(false);
    };

    // Fetch historical stock data
    const fetchHistoricalData = async () => {
        if (!symbol) return alert("Enter a stock symbol!");
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    access_key: API_KEY,
                    symbols: `${symbol}.XNSE`,
                    date_from: getStartDate(),
                    date_to: new Date().toISOString().split("T")[0], // Today's date
                    limit: 100, // Fetch up to 100 records
                },
            });

            setHistoricalData(response.data.data); // Store historical data
        } catch (err) {
            setError("Failed to fetch historical data. Try again.");
            console.error(err);
        }

        setLoading(false);
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Stock Market Data</h2>
            <input
                type="text"
                placeholder="Enter stock symbol (e.g., RELIANCE)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                style={{ padding: "10px", marginRight: "10px" }}
            />
            <button onClick={fetchStockData} style={{ padding: "10px 15px", cursor: "pointer", marginRight: "10px" }}>
                Fetch Latest Data
            </button>

            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ padding: "10px", marginRight: "10px" }}>
                <option value="1week">Past Week</option>
                <option value="1month">Past Month</option>
                <option value="1year">Past Year</option>
                <option value="5years">Past 5 Years</option>
            </select>

            <button onClick={fetchHistoricalData} style={{ padding: "10px 15px", cursor: "pointer" }}>
                Fetch Historical Data
            </button>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {stockData && (
                <div style={{ marginTop: "20px", textAlign: "left", maxWidth: "400px", margin: "auto" }}>
                    <h3>{stockData.symbol}</h3>
                    <p><strong>Market Price:</strong> ₹{stockData.close}</p>
                    <p><strong>Open:</strong> ₹{stockData.open}</p>
                    <p><strong>High:</strong> ₹{stockData.high}</p>
                    <p><strong>Low:</strong> ₹{stockData.low}</p>
                    <p><strong>Volume:</strong> {stockData.volume}</p>
                </div>
            )}

            {historicalData.length > 0 && (
                <div style={{ marginTop: "30px" }}>
                    <h3>Historical Data ({timeRange.replace("1", "Past ")})</h3>
                    <table border="1" style={{ margin: "auto", borderCollapse: "collapse", width: "80%" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f2f2f2" }}>
                                <th style={{ padding: "10px" }}>Date</th>
                                <th style={{ padding: "10px" }}>Open</th>
                                <th style={{ padding: "10px" }}>Close</th>
                                <th style={{ padding: "10px" }}>High</th>
                                <th style={{ padding: "10px" }}>Low</th>
                                <th style={{ padding: "10px" }}>Volume</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historicalData.slice(0, 10).map((item, index) => (
                                <tr key={index}>
                                    <td style={{ padding: "10px" }}>{item.date.split("T")[0]}</td>
                                    <td style={{ padding: "10px" }}>₹{item.open}</td>
                                    <td style={{ padding: "10px" }}>₹{item.close}</td>
                                    <td style={{ padding: "10px" }}>₹{item.high}</td>
                                    <td style={{ padding: "10px" }}>₹{item.low}</td>
                                    <td style={{ padding: "10px" }}>{item.volume}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StockMarketFetcher;
