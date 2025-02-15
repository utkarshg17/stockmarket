import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StockCorrelation.css";
import { calculateCorrelation, calculateCorrelationReturns } from "../../helperFunctions/metricsHelperFunctions.js";
import CorrelationChart from "../../components/CorrelationChart.js";
import DropdownFromCSV from "../../components/dropdownFromCSV.js";

const API_KEY = "9630ecf1d09165b08ad3621ec7efb550";
const BASE_URL = "http://api.marketstack.com/v1/eod";

const StockCorrelation = () => {
    const [timeRange, setTimeRange] = useState("1year");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    //fetch correlation data
    const fetchCorrelationData = () => {
        // Get the value from the dropdown using its name
        const stock1Symbol = document.getElementsByName("stock1Dropdown")[0];
        const stock2Symbol = document.getElementsByName("stock2Dropdown")[0];
        if (stock1Symbol && stock1Symbol.value && stock2Symbol && stock2Symbol.value) {
            setStock1Symbol(stock1Symbol.value);
            setStock2Symbol(stock2Symbol.value);
        } else {
            alert("Please select a stock.");
        }
    }

    useEffect(() => {
        if (stock1Symbol != "" && stock2Symbol != "") {
            fetchStock1Data();
            fetchStock2Data();
        }
    }, [timeRange, stock1Symbol, stock2Symbol])

    //fetch stock 1 data
    const fetchStock1Data = async () => {
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
    }

    //fetch stock 2 data
    const fetchStock2Data = async () => {
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
    }, [stock1, stock2]);

    return (
        <div className="main-container">
            {/* LEFT PANE: Input Panel */}
            <div className="left-pane">
                <div className="input-container">
                    <h2>Correlation Analysis</h2>
                    <DropdownFromCSV csvFile={"/data/tickerData_NSE.csv"} dropdownName={"stock1Dropdown"} />
                    <DropdownFromCSV csvFile={"/data/tickerData_NSE.csv"} dropdownName={"stock2Dropdown"} />
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                        <option value="1week">Past Week</option>
                        <option value="1month">Past Month</option>
                        <option value="1year">Past Year</option>
                        <option value="5years">Past 5 Years</option>
                    </select>
                    <button onClick={fetchCorrelationData}>Correlation Analysis</button>
                </div>
            </div>

            {/* RIGHT PANE: Chart + Key Metrics + Table */}
            <div className="right-pane">
                {loading && <p>Loading...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}

                {/* CORRELATION TREND GRAPH */}
                {stock1.length > 0 && stock2.length && (
                    <div>
                        <h3>Correlation Trend</h3>
                        <div className="stock-chart">
                            <CorrelationChart stockReturns1={stock1Returns} stockReturns2={stock2Returns} />
                        </div>
                    </div>
                )}

                {/* CORRELATION DATA */}
                {stock1.length > 0 && stock2.length > 0 && (
                    <div>
                        <h3>Correlation Value</h3>
                        <p>Correlation: {correlation != null ? correlation : "-"}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockCorrelation;
