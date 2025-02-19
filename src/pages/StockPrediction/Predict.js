/* global tf */

import React, { useState, useEffect, useCallback } from "react";
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

    const [progress, setProgress] = useState(0);
    const [trainingStatus, setTrainingStatus] = useState("");

    const [predictions, setPredictions] = useState([]);

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

    const getToDate = () => {
        let toDate = new Date();
        const todaysDate = new Date();
        toDate.setDate(todaysDate.getDate() - 6);

        return toDate.toISOString().split("T")[0];
    }

    useEffect(() => {
        if (symbol != "") {
            fetchHistoricalData();
            fetchMarketData();
        }
    }, [symbol, timeRange])

    useEffect(() => {
        if (marketData.length > 0 && historicalData.length > 0) {
            setBeta(calculateBeta(historicalData, marketData));
            setVolatility(calculateVolatility(historicalData));
            setRSI(calculateRSI(historicalData));

            //predict stock data
            predictStockData(historicalData, marketData);
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

    async function fetchStockData(historicalData, marketData) {
        let openingPrices = historicalData.map(d => d.open);
        let closingPrices = historicalData.map(d => d.close);
        let volumes = historicalData.map(d => d.volume);
        let highPrices = historicalData.map(d => d.high);
        let lowPrices = historicalData.map(d => d.low);
        let marketCloses = marketData.map(d => d.close); // Market close prices

        // Trim datasets to the length of the shorter one
        let minLength = Math.min(openingPrices.length, marketCloses.length);

        return {
            openingPrices: openingPrices.slice(0, minLength),
            closingPrices: closingPrices.slice(0, minLength),
            volumes: volumes.slice(0, minLength),
            highPrices: highPrices.slice(0, minLength),
            lowPrices: lowPrices.slice(0, minLength),
            marketCloses: marketCloses.slice(0, minLength)
        };
    }

    function normalize(data) {
        let min = Math.min(...data);
        let max = Math.max(...data);
        let normalized = data.map(value => (value - min) / (max - min)); // Normalize between 0-1
        return { normalized, min, max };
    }

    function createSequences(openPrices, closePrices, volumes, highPrices, lowPrices, marketCloses, sequenceLength) {
        let inputs = [];
        let labels = [];

        for (let i = 0; i < closePrices.length - sequenceLength; i++) {
            let seq = [];
            for (let j = 0; j < sequenceLength; j++) {
                seq.push([
                    openPrices[i + j],
                    closePrices[i + j],
                    volumes[i + j],
                    highPrices[i + j],
                    lowPrices[i + j],
                    marketCloses[i + j]  // ✅ Adding Market Data
                ]);
            }
            let label = [closePrices[i + sequenceLength]]; // Predicting next day's closing price

            inputs.push(seq);
            labels.push(label);
        }

        return {
            inputs: tf.tensor3d(inputs, [inputs.length, sequenceLength, 6]),  // Shape: (batch, sequence, features)
            labels: tf.tensor2d(labels, [labels.length, 1])  // Shape: (batch, 1)
        };
    }

    async function trainModel(inputs, labels) {
        const model = tf.sequential();

        model.add(tf.layers.lstm({
            units: 50, returnSequences: false, inputShape: [inputs.shape[1], 6]  // Updated to use 5 features
        }));

        model.add(tf.layers.dense({ units: 1 }));

        model.compile({
            optimizer: 'adam',
            loss: 'meanSquaredError'
        });

        let epochs = 50;

        // Callback to update training progress
        const progressCallback = {
            onEpochEnd: (epoch, logs) => {
                let progress = Math.round(((epoch + 1) / epochs) * 100);
                setProgress(progress); // Update progress state
                setTrainingStatus(`Training Progress: ${progress}%`);
            }
        };

        await model.fit(inputs, labels, {
            epochs: 50,
            batchSize: 8,
            callbacks: progressCallback
        });

        setTrainingStatus("Training Complete!");
        return model;
    }

    async function predictNextPrice(model, lastSequence, minClose, maxClose) {
        let inputTensor = tf.tensor3d([lastSequence], [1, lastSequence.length, 6]); // ✅ Now using 6 features
        let prediction = model.predict(inputTensor);
        let predictedValue = prediction.dataSync()[0]; // Convert tensor to number

        // Denormalize closing price
        let actualPrice = (predictedValue * (maxClose - minClose)) + minClose;

        return actualPrice;
    }

    async function predictNextNDays(model, lastSequence, minOpen, maxOpen, minClose, maxClose, minVol, maxVol, minHigh, maxHigh, minLow, maxLow, minMarket, maxMarket, days) {
        let futurePredictions = [];

        for (let i = 0; i < days; i++) {
            let predictedClose = await predictNextPrice(model, lastSequence, minClose, maxClose);
            futurePredictions.push(predictedClose);

            // Update sequence: Remove first entry, append new prediction
            let lastDayOpen = lastSequence[lastSequence.length - 1][0];
            let lastDayVolume = lastSequence[lastSequence.length - 1][2];
            let lastDayHigh = lastSequence[lastSequence.length - 1][3];
            let lastDayLow = lastSequence[lastSequence.length - 1][4];
            let lastDayMarketClose = lastSequence[lastSequence.length - 1][5];
            let normalizedPredictedClose = (predictedClose - minClose) / (maxClose - minClose);

            lastSequence = [...lastSequence.slice(1), [lastDayOpen, normalizedPredictedClose, lastDayVolume, lastDayHigh, lastDayLow, lastDayMarketClose]];
        }

        return futurePredictions;
    }

    async function predictStockData(historicalData, marketData) {
        setProgress(0);
        setPredictions([]);

        historicalData = [...historicalData].reverse();
        marketData = [...marketData].reverse(); // Ensure market data is in the same order

        let { openingPrices, closingPrices, volumes, highPrices, lowPrices, marketCloses } = await fetchStockData(historicalData, marketData);

        // Normalize all six features separately
        let { normalized: normalizedOpen, min: minOpen, max: maxOpen } = normalize(openingPrices);
        let { normalized: normalizedClose, min: minClose, max: maxClose } = normalize(closingPrices);
        let { normalized: normalizedVolumes, min: minVol, max: maxVol } = normalize(volumes);
        let { normalized: normalizedHigh, min: minHigh, max: maxHigh } = normalize(highPrices);
        let { normalized: normalizedLow, min: minLow, max: maxLow } = normalize(lowPrices);
        let { normalized: normalizedMarket, min: minMarket, max: maxMarket } = normalize(marketCloses);

        let seqLength = 3;
        let { inputs, labels } = createSequences(normalizedOpen, normalizedClose, normalizedVolumes, normalizedHigh, normalizedLow, normalizedMarket, seqLength);

        let model = await trainModel(inputs, labels);

        let lastSequence = normalizedClose.slice(-seqLength).map((val, idx) => [
            normalizedOpen[normalizedOpen.length - seqLength + idx],
            val,
            normalizedVolumes[normalizedVolumes.length - seqLength + idx],
            normalizedHigh[normalizedHigh.length - seqLength + idx],
            normalizedLow[normalizedLow.length - seqLength + idx],
            normalizedMarket[normalizedMarket.length - seqLength + idx]
        ]);

        let next5DaysPrices = await predictNextNDays(model, lastSequence, minOpen, maxOpen, minClose, maxClose, minVol, maxVol, minHigh, maxHigh, minLow, maxLow, minMarket, maxMarket, 5);

        setPredictions(next5DaysPrices);

        console.log("Predicted Stock Prices for Next 5 Days:", next5DaysPrices.map(p => p.toFixed(2)));
    }

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