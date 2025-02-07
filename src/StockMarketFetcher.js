import React, { useState } from "react";
import axios from "axios";
import "./StockMarketFetcher.css";
import StockChart from "./StockChart";

const API_KEY = "ab48383ff42ff55b95072823c6ffa5ad";
const BASE_URL = "http://api.marketstack.com/v1/eod";

const MarketStackFetcher = () => {
    const [symbol, setSymbol] = useState("");
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState("1week");

    // Get start date based on selected time range
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
            default:
                startDate.setDate(today.getDate() - 7);
        }

        return startDate.toISOString().split("T")[0]; // Format YYYY-MM-DD
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
                    symbols: `${symbol}.XNSE`, // NSE stocks
                    date_from: getStartDate(),
                    date_to: new Date().toISOString().split("T")[0], // Today's date
                    limit: 2000,
                },
            });

            if (!response.data || !response.data.data || response.data.data.length === 0) {
                setError("No data found. Please try another stock.");
                setLoading(false);
                return;
            }

            setHistoricalData(response.data.data.slice(0, 2000));
        } catch (err) {
            setError("Failed to fetch historical data. Try again.");
            console.error(err);
        }

        setLoading(false);
    };

    return (
        <div className="stock-container">
            <h2>MarketStack Stock Data</h2>
            <div className="input-container">
                <input
                    type="text"
                    placeholder="Enter stock symbol (e.g., RELIANCE)"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                />
                <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                    <option value="1week">Past Week</option>
                    <option value="1month">Past Month</option>
                    <option value="1year">Past Year</option>
                </select>
                <button onClick={fetchHistoricalData}>Fetch Historical Data</button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {historicalData.length > 0 && (
                <div>
                    <h3>Price Trend</h3>
                    <StockChart
                        dates={historicalData.map((item) => item.date)}
                        prices={historicalData.map((item) => item.close)}
                    />
                </div>
            )}

            {historicalData.length > 0 && (
                <div>
                    <h3>Historical Data ({timeRange.replace("1", "Past ")})</h3>
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Open</th>
                                <th>Close</th>
                                <th>High</th>
                                <th>Low</th>
                                <th>Volume</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historicalData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.date.split("T")[0]}</td>
                                    <td>₹{item.open.toFixed(2)}</td>
                                    <td>₹{item.close.toFixed(2)}</td>
                                    <td>₹{item.high.toFixed(2)}</td>
                                    <td>₹{item.low.toFixed(2)}</td>
                                    <td>{item.volume.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MarketStackFetcher;