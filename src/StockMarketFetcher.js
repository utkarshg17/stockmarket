import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StockMarketFetcher.css";
import StockChart from "./StockChart.js";

const API_KEY = "9630ecf1d09165b08ad3621ec7efb550";
const BASE_URL = "http://api.marketstack.com/v1/eod";
const MARKET_INDEX = "NSEI.INDX"; // Market benchmark for Beta calculation

const MarketStackFetcher = () => {
    const [symbol, setSymbol] = useState("");
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState("1year");

    const [marketData, setMarketData] = useState([]);
    const [beta, setBeta] = useState(null);
    const [volatility, setVolatility] = useState(null);
    const [RSI, setRSI] = useState(null)

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
            case "5year":
                startDate.setFullYear(today.getFullYear() - 5);
                break;
            default:
                startDate.setDate(today.getDate() - 7);
        }

        return startDate.toISOString().split("T")[0];
    };

    function fetchData() {
        fetchHistoricalData();
        fetchMarketData();
    }

    // Function to calculate Beta after Market Data updates
    useEffect(() => {
        if (marketData.length > 0 && historicalData.length > 0) {
            calculateBeta();
            calculateVolatility(historicalData);
            calculateRSI(historicalData);
        }
    }, [marketData, historicalData]); // Runs when `marketData` OR `historicalData` updates

    const fetchHistoricalData = async () => {
        if (!symbol) return alert("Enter a stock symbol!");
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    access_key: API_KEY,
                    symbols: `${symbol}`,
                    date_from: getStartDate(),
                    date_to: new Date().toISOString().split("T")[0],
                    limit: 2000
                },
            });

            if (!response.data || !response.data.data || response.data.data.length === 0) {
                setError("No data found. Please try another stock.");
                setLoading(false);
                return;
            }

            setHistoricalData(response.data.data.slice(0, 2000)); // Limit to last 10 records
            console.log(response.data.data.slice(0, 2000))
        } catch (err) {
            setError("Failed to fetch historical data. Try again.");
            console.error(err);
        }

        setLoading(false);
    };

    // Fetch Market Index Data
    const fetchMarketData = async () => {
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    access_key: API_KEY,
                    symbols: `${MARKET_INDEX}`, // Fetch NIFTY 50 Data
                    date_from: getStartDate(),
                    date_to: new Date().toISOString().split("T")[0],
                    limit: 2000
                },
            });

            if (!response.data || !response.data.data || response.data.data.length === 0) {
                setError("No market data found.");
                return;
            }

            setMarketData(response.data.data.slice(0, 2000)); // Oldest data first
            console.log(response.data.data.slice(0, 2000));
        } catch (err) {
            setError("Failed to fetch market data.");
            console.error(err);
        }
    };

    const calculateBeta = () => {
        if (!historicalData.length || !marketData.length) {
            console.warn("Insufficient data to calculate Beta.");
            return;
        }

        // Ensure both datasets have the same length
        const minLength = Math.min(historicalData.length, marketData.length);
        const stockDataTrimmed = historicalData.slice(-minLength); // Take last `minLength` entries
        const marketDataTrimmed = marketData.slice(-minLength);

        // Compute daily returns
        const stockReturns = stockDataTrimmed.map((d, i, arr) =>
            i > 0 ? (d.close - arr[i - 1].close) / arr[i - 1].close : 0
        ).slice(1); // Remove first undefined return

        const marketReturns = marketDataTrimmed.map((d, i, arr) =>
            i > 0 ? (d.close - arr[i - 1].close) / arr[i - 1].close : 0
        ).slice(1);

        if (stockReturns.length !== marketReturns.length) {
            console.warn("Data mismatch after trimming. Cannot calculate Beta.");
            return;
        }

        // Compute mean returns
        const meanStock = stockReturns.reduce((a, b) => a + b, 0) / stockReturns.length;
        const meanMarket = marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length;

        let covariance = 0;
        let marketVariance = 0;

        for (let i = 0; i < stockReturns.length; i++) {
            covariance += (stockReturns[i] - meanStock) * (marketReturns[i] - meanMarket);
            marketVariance += (marketReturns[i] - meanMarket) ** 2;
        }

        setBeta(covariance / marketVariance);
    };

    //calculate volatility
    const calculateVolatility = (stockData) => {
        if (stockData.length < 2) return 0; // Not enough data

        // Step 1: Compute daily returns
        const returns = stockData.map((d, i, arr) =>
            i > 0 ? (d.close - arr[i - 1].close) / arr[i - 1].close : 0
        ).slice(1); // Remove first element (undefined return)

        // Step 2: Calculate Mean Return
        const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

        // Step 3: Compute Variance (Sum of squared deviations from mean)
        const variance = returns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / returns.length;

        // Step 4: Standard Deviation (Volatility)
        const volatility = Math.sqrt(variance);

        // Convert to percentage (Annualized if needed)
        setVolatility((volatility * 100).toFixed(2)); // Returns as a percentage
    };

    //calculate RSI
    const calculateRSI = (stockData, period = 14) => {
        if (stockData.length < period) return null; // Not enough data

        let gains = [];
        let losses = [];

        // Step 1: Compute daily changes
        for (let i = 1; i < stockData.length; i++) {
            let change = stockData[i].close - stockData[i - 1].close;
            if (change > 0) {
                gains.push(change);
                losses.push(0);
            } else {
                gains.push(0);
                losses.push(Math.abs(change));
            }
        }

        // Step 2: Compute the initial Average Gain & Loss (Simple Moving Average)
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

        // Step 3: Compute RSI using the Smoothed Moving Average
        for (let i = period; i < gains.length; i++) {
            avgGain = (avgGain * (period - 1) + gains[i]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        }

        // Step 4: Compute RS & RSI
        let RS = avgLoss === 0 ? 100 : avgGain / avgLoss; // Prevent division by zero
        let RSI = 100 - (100 / (1 + RS));

        setRSI(RSI.toFixed(2)); // Round to 2 decimal places
    };

    return (
        <div className="main-container">

            {/* LEFT PANE: Input Panel */}
            <div className="left-pane">
                <h2>Stock Input</h2>
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
                        <option value="5year">Past 5 Years</option>
                    </select>
                    <button onClick={fetchData}>Fetch Historical Data</button>
                </div>
            </div>

            {/* RIGHT PANE: Chart + Key Metrics + Table */}
            <div className="right-pane">
                {loading && <p>Loading...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}

                {/* PRICE TREND GRAPH */}
                {historicalData.length > 0 && (
                    <div>
                        <h3>Price Trend</h3>
                        <div className="stock-chart">
                            <StockChart
                                dates={historicalData.map((item) => item.date.split("T")[0])}
                                prices={historicalData.map((item) => item.close)}
                            />
                        </div>
                    </div>
                )}

                {/* KEY METRICS SECTION */}
                {marketData.length > 0 && (
                    <div>
                        <h3>Key Metrics</h3>
                        <div className="key-metrics-container">
                            <div className="metric-card">
                                <span className="metric-icon">📊</span>
                                <p>Beta Value</p>
                                <h4>{beta != null ? beta.toFixed(2) : "0.00"}</h4>
                            </div>

                            <div className="metric-card">
                                <span className="metric-icon">📉</span>
                                <p>Volatility (%)</p>
                                <h4>{volatility != null ? volatility : "0.00"}</h4>
                            </div>

                            <div className="metric-card">
                                <span className="metric-icon">📈</span>
                                <p>RSI</p>
                                <h4>{RSI != null ? RSI : "-"}</h4>
                            </div>
                        </div>
                    </div>
                )}

                {/* HISTORICAL DATA TABLE */}
                {historicalData.length > 0 && (
                    <div>
                        <h3>Historical Data</h3>
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
        </div>
    );
};

export default MarketStackFetcher;
