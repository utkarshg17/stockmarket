import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./Predict.css";
import StockChart from "../../components/StockChart.js";
import { calculateBeta, calculateVolatility, calculateRSI } from "../../helperFunctions/metricsHelperFunctions.js";
import DropdownFromCSV from "../../components/dropdownFromCSV.js";
import { predictStockData } from "../../helperFunctions/predictionHelperFunctions.js";

const API_KEY = "9630ecf1d09165b08ad3621ec7efb550";
const BASE_URL = "http://api.marketstack.com/v1/eod";
const MARKET_INDEX = "NSEI.INDX"; // Market benchmark for Beta calculation
const NASDAQ_INDEX = "NDAQ"; //Market index for NASDAQ

const Predict = () => {
    const [symbol, setSymbol] = useState("");
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState("3months");

    const [marketData, setMarketData] = useState([]);
    const [beta, setBeta] = useState(null);
    const [volatility, setVolatility] = useState(null);
    const [RSI, setRSI] = useState(null)

    const [progress, setProgress] = useState(0);
    const [trainingStatus, setTrainingStatus] = useState("");

    const [predictions, setPredictions] = useState([]);

    const [NASDAQ, setNASDAQ] = useState([]);

    const getStartDate = () => {
        const today = new Date();
        let startDate = new Date();

        switch (timeRange) {
            case "3months":
                startDate.setMonth(today.getMonth() - 3);
                break;
            case "6months":
                startDate.setMonth(today.getMonth() - 6);
                break;
            case "1year":
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            case "5years":
                startDate.setFullYear(today.getFullYear() - 5);
                break;
            case "10years":
                startDate.setFullYear(today.getFullYear() - 10);
                break;
            default:
                startDate.setDate(today.getMonth() - 3);
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

    const getToDate = () => {
        let toDate = new Date();
        const todaysDate = new Date();
        toDate.setDate(todaysDate.getDate() - 10);

        return toDate.toISOString().split("T")[0];
    }

    useEffect(() => {
        if (symbol != "") {
            fetchHistoricalData();
            fetchMarketData();
            fetchNASDAQData();
        }
    }, [symbol, timeRange])

    useEffect(() => {
        if (marketData.length > 0 && historicalData.length > 0 && NASDAQ.length > 0) {
            setBeta(calculateBeta(historicalData, marketData));
            setVolatility(calculateVolatility(historicalData));
            setRSI(calculateRSI(historicalData));

            //predict stock data
            predictStockData(setProgress, setPredictions, setTrainingStatus, historicalData, marketData, NASDAQ);
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
                    date_to: getToDate(),
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
                    date_to: getToDate(),
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

    // Fetch NASDAQ Data
    const fetchNASDAQData = async () => {
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    access_key: API_KEY,
                    symbols: `${NASDAQ_INDEX}`, // Fetch NIFTY 50 Data
                    date_from: getStartDate(),
                    date_to: getToDate(),
                    limit: 2000
                },
            });

            if (!response.data || !response.data.data || response.data.data.length === 0) {
                setError("No market data found.");
                return;
            }

            setNASDAQ(response.data.data.slice(0, 2000)); // Oldest data first
        } catch (err) {
            setError("Failed to fetch market data.");
            console.error(err);
        }
    };

    return (
        <div className="main-container">
            {/* LEFT PANE: Input Panel */}
            <div className="left-pane">
                {/* Content Based on Active Tab */}
                <div className="input-container">
                    <h2>Stock Predictor</h2>
                    <DropdownFromCSV csvFile={"/data/tickerData_NSE.csv"} dropdownName={"stockDropdown"} />
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                        <option value="3months">Past 3 Months</option>
                        <option value="6months">Past 6 Months</option>
                        <option value="1year">Past Year</option>
                        <option value="5years">Past 5 Years</option>
                        <option value="10years">Past 10 Years</option>
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

                {/*PREDICTED DATA*/}
                {historicalData.length > 0 && (
                    <div>
                        <h3>Predicted Data</h3>
                        <p>{trainingStatus}</p>
                    </div>
                )}

                {/*PREDICTED STOCK PRICES*/}
                {predictions.length > 0 && (
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Predicted Closing Price (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.map((price, index) => (
                                <tr key={index}>
                                    <td>Day {index + 1}</td>
                                    <td>₹{price.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

export default Predict;