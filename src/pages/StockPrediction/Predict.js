/* global tf */

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Predict.css";
import StockChart from "../../components/StockChart.js";
import { calculateBeta, calculateVolatility, calculateRSI } from "../../helperFunctions/metricsHelperFunctions.js";
import DropdownFromCSV from "../../components/dropdownFromCSV.js";

const API_KEY = "9630ecf1d09165b08ad3621ec7efb550";
const BASE_URL = "http://api.marketstack.com/v1/eod";
const MARKET_INDEX = "NSEI.INDX"; // Market benchmark for Beta calculation

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

    const getStartDate = () => {
        const today = new Date();
        let startDate = new Date();

        switch (timeRange) {
            case "3months":
                startDate.setMonth(today.getMonth() - 3);
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

            //predict stock data
            predictStockData();
        }
    }, [symbol, timeRange])

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
                        <option value="1year">Past Year</option>
                        <option value="5years">Past 5 Years</option>
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

export default Predict;

async function fetchStockData() {
    // Simulated API data (Replace this with actual API call)
    let data = [
        { "close": 24.53, "volume": 686334 },
        { "close": 25.37, "volume": 854679 },
        { "close": 26.13, "volume": 654154 },
        { "close": 26.96, "volume": 359843 },
        { "close": 27.07, "volume": 1012378 }
    ];

    let closingPrices = data.map(d => d.close);
    let volumes = data.map(d => d.volume);

    console.log(closingPrices, volumes);

    return { closingPrices, volumes };
}

function normalize(data) {
    let min = Math.min(...data);
    let max = Math.max(...data);
    let normalized = data.map(value => (value - min) / (max - min)); // Normalize between 0-1
    return { normalized, min, max };
}

function createSequences(prices, volumes, sequenceLength) {
    let inputs = [];
    let labels = [];

    for (let i = 0; i < prices.length - sequenceLength; i++) {
        let seq = [];
        for (let j = 0; j < sequenceLength; j++) {
            seq.push([prices[i + j], volumes[i + j]]);  // Each timestep has [closing price, volume]
        }
        let label = [prices[i + sequenceLength]]; // Next day's closing price

        inputs.push(seq);
        labels.push(label);
    }

    return {
        inputs: tf.tensor3d(inputs, [inputs.length, sequenceLength, 2]),  // Shape: (batch, sequence, features)
        labels: tf.tensor2d(labels, [labels.length, 1])  // Shape: (batch, 1)
    };
}

async function trainModel(inputs, labels) {
    const model = tf.sequential();

    model.add(tf.layers.lstm({
        units: 50, returnSequences: false, inputShape: [inputs.shape[1], 2]  // Updated to use 2 features
    }));

    model.add(tf.layers.dense({ units: 1 }));

    model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
    });

    await model.fit(inputs, labels, {
        epochs: 50,
        batchSize: 8
    });

    return model;
}

async function predictNextPrice(model, lastSequence, minPrice, maxPrice) {
    let inputTensor = tf.tensor3d([lastSequence], [1, lastSequence.length, 2]); // ✅ Using 2 features
    let prediction = model.predict(inputTensor);
    let predictedValue = prediction.dataSync()[0]; // Convert tensor to number

    // Denormalize
    let actualPrice = (predictedValue * (maxPrice - minPrice)) + minPrice;

    return actualPrice;
}

async function predictNextNDays(model, lastSequence, minPrice, maxPrice, minVol, maxVol, days) {
    let futurePredictions = [];

    for (let i = 0; i < days; i++) {
        let predictedPrice = await predictNextPrice(model, lastSequence, minPrice, maxPrice);
        futurePredictions.push(predictedPrice);

        // Update sequence: remove first value, append new prediction (volume remains last day's volume)
        let lastDayVolume = lastSequence[lastSequence.length - 1][1]; // Use last day's volume (normalized)
        lastSequence = [...lastSequence.slice(1), [(predictedPrice - minPrice) / (maxPrice - minPrice), lastDayVolume]];
    }

    return futurePredictions;
}

async function predictStockData() {
    let { closingPrices, volumes } = await fetchStockData();

    // Normalize closing prices and volume separately
    let { normalized: normalizedPrices, min: minPrice, max: maxPrice } = normalize(closingPrices);
    let { normalized: normalizedVolumes, min: minVol, max: maxVol } = normalize(volumes);

    let seqLength = 3; // Use last 3 days to predict the next day
    let { inputs, labels } = createSequences(normalizedPrices, normalizedVolumes, seqLength);

    let model = await trainModel(inputs, labels);

    let lastSequence = normalizedPrices.slice(-seqLength).map((val, idx) => [val, normalizedVolumes[normalizedVolumes.length - seqLength + idx]]);

    let next5DaysPrices = await predictNextNDays(model, lastSequence, minPrice, maxPrice, minVol, maxVol, 5);

    console.log("Predicted Stock Prices for Next 5 Days:", next5DaysPrices.map(p => p.toFixed(2)));
}




