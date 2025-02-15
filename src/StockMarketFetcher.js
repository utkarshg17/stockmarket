import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StockMarketFetcher.css";
import StockChart from "./components/StockChart.js";
import { calculateBeta, calculateVolatility, calculateRSI, calculateCorrelation, calculateCorrelationReturns } from "./helperFunctions/metricsHelperFunctions.js";
import CorrelationChart from "./components/CorrelationChart.js";
import DropdownFromCSV from "./components/dropdownFromCSV.js";

const API_KEY = "9630ecf1d09165b08ad3621ec7efb550";
const BASE_URL = "http://api.marketstack.com/v1/eod";
const MARKET_INDEX = "NSEI.INDX"; // Market benchmark for Beta calculation

const StockMarketFetcher = () => {
    const [activeTab, setActiveTab] = useState("stock"); // Default to Stock Analysis

    const [symbol, setSymbol] = useState("");
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState("1year");

    const [marketData, setMarketData] = useState([]);
    const [beta, setBeta] = useState(null);
    const [volatility, setVolatility] = useState(null);
    const [RSI, setRSI] = useState(null)

    const [stock1Symbol, setStock1Symbol] = useState("");
    const [stock2Symbol, setStock2Symbol] = useState("");
    const [stock1, setStock1] = useState([]);
    const [stock2, setStock2] = useState([]);
    const [stock1Returns, setStock1Returns] = useState([]);
    const [stock2Returns, setStock2Returns] = useState([]);

    const [correlation, setCorrelation] = useState(null);

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

        return startDate.toISOString().split("T")[0];
    };

    function fetchData() {
        // Get the value from the dropdown using its name
        const stockSymbol = document.getElementsByName("stockDropdown")[0];
        if (stockSymbol && stockSymbol.value) {
            setSymbol(stockSymbol.value); // Update the state
        } else {
            alert("Please select a stock.");
        }
    }

    useEffect(() => {
        if (symbol != "") {
            fetchHistoricalData();
            fetchMarketData();
        }
    }, [symbol])

    useEffect(() => {
        if (marketData.length > 0 && historicalData.length > 0) {
            setBeta(calculateBeta(historicalData, marketData));
            setVolatility(calculateVolatility(historicalData));
            setRSI(calculateRSI(historicalData));
        }
    }, [marketData, historicalData]); // Runs when `marketData` OR `historicalData` updates

    //fetch historical data for stock
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
        } catch (err) {
            setError("Failed to fetch market data.");
            console.error(err);
        }
    };

    //fetch correlation data
    const fetchCorrelationData = async () => {
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    access_key: API_KEY,
                    symbols: `${stock1Symbol}`, // Fetch NIFTY 50 Data
                    date_from: getStartDate(),
                    date_to: new Date().toISOString().split("T")[0],
                    limit: 2000
                },
            });

            if (!response.data || !response.data.data || response.data.data.length === 0) {
                setError("No market data found.");
                return;
            }

            setStock1(response.data.data.slice(0, 2000)); // Oldest data first
        } catch (err) {
            setError("Failed to fetch market data.");
            console.error(err);
        }

        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    access_key: API_KEY,
                    symbols: `${stock2Symbol}`, // Fetch NIFTY 50 Data
                    date_from: getStartDate(),
                    date_to: new Date().toISOString().split("T")[0],
                    limit: 2000
                },
            });

            if (!response.data || !response.data.data || response.data.data.length === 0) {
                setError("No market data found.");
                return;
            }

            setStock2(response.data.data.slice(0, 2000)); // Oldest data first
        } catch (err) {
            setError("Failed to fetch market data.");
            console.error(err);
        }
    }

    //runs when there is data in stock 1 and stock 2
    useEffect(() => {
        if (stock1.length > 0 && stock2.length > 0) {
            setCorrelation(calculateCorrelation(stock1, stock2));
            const correlationReturns = calculateCorrelationReturns(stock1, stock2);
            setStock1Returns(correlationReturns[0]);
            setStock2Returns(correlationReturns[1]);
        }
    }, [stock1, stock2]); // Runs when `marketData` OR `historicalData` updates

    return (
        <div className="main-container">
            {/* LEFT PANE: Input Panel */}
            <div className="left-pane">
                {/* Menu Toggle */}
                <div className="menu-switcher">
                    <button
                        className={activeTab === "stock" ? "active" : ""}
                        onClick={() => setActiveTab("stock")}
                    >
                        Stock Analysis
                    </button>
                    <button
                        className={activeTab === "correlation" ? "active" : ""}
                        onClick={() => setActiveTab("correlation")}
                    >
                        Correlation Analysis
                    </button>
                </div>

                {/* Content Based on Active Tab */}
                {activeTab === "stock" ? (
                    <div className="input-container">
                        <h2>Stock Input</h2>
                        {/* <input
                            type="text"
                            placeholder="Enter stock symbol (e.g., INFY.XNSE)"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                        /> */}
                        <DropdownFromCSV csvFile={"/data/tickerData_NSE.csv"} />
                        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                            <option value="1week">Past Week</option>
                            <option value="1month">Past Month</option>
                            <option value="1year">Past Year</option>
                            <option value="5years">Past 5 Years</option>
                        </select>
                        <button onClick={fetchData}>Fetch Historical Data</button>
                    </div>
                ) : (
                    <div className="input-container">
                        <h2>Correlation Analysis</h2>
                        <input
                            type="text"
                            placeholder="Enter stock 1 symbol (e.g., INFY.XNSE)"
                            value={stock1Symbol}
                            onChange={(e) => setStock1Symbol(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Enter stock 2 symbol (e.g., RELIANCE.XNSE)"
                            value={stock2Symbol}
                            onChange={(e) => setStock2Symbol(e.target.value)}
                        />
                        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                            <option value="1week">Past Week</option>
                            <option value="1month">Past Month</option>
                            <option value="1year">Past Year</option>
                            <option value="5years">Past 5 Years</option>
                        </select>
                        <button onClick={fetchCorrelationData}>Correlation Analysis</button>
                    </div>
                )}
            </div>

            {/* RIGHT PANE: Chart + Key Metrics + Table */}
            <div className="right-pane">
                {loading && <p>Loading...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}

                {/* PRICE TREND GRAPH */}
                {historicalData.length > 0 && activeTab === "stock" && (
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
                {marketData.length > 0 && activeTab === "stock" && (
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
                {historicalData.length > 0 && activeTab === "stock" && (
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

                {/* CORRELATION TREND GRAPH */}
                {stock1.length > 0 && stock2.length && activeTab !== "stock" && (
                    <div>
                        <h3>Correlation Trend</h3>
                        <div className="stock-chart">
                            <CorrelationChart stockReturns1={stock1Returns} stockReturns2={stock2Returns} />
                        </div>
                    </div>
                )}

                {/* CORRELATION DATA */}
                {stock1.length > 0 && stock2.length > 0 && activeTab !== "stock" && (
                    <div>
                        <h3>Correlation Value</h3>
                        <p>Correlation: {correlation != null ? correlation : "-"}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockMarketFetcher;
