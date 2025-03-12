import React, { useState, useEffect } from "react";
import "./EfficientFrontier.css";
import DropdownFromCSV from "../../components/dropdownFromCSV.js";
import { fetchIndexData, fetchStockData, fetchMultipleStocks } from "../../helperFunctions/fetchingHelperFunctions.js";
import { runEfficientFrontierAnalysis, findEfficientPortfolio } from "../../helperFunctions/efficientFrontierHelperFunctions.js";
import XYChart from "../../components/XYChart.js";
import EfficientFrontierChart from "../../components/EfficientFrontierChart.js";

const EfficientFrontier = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState("1year");

    const [stocks, setStocks] = useState([""]); // Initial stock
    const [stockData, setStockData] = useState([]); //Stock Data
    const [portfolios, setPortfolios] = useState([]);   //set portoflios
    const [risks, setRisks] = useState([]);
    const [returns, setReturns] = useState([]);
    const [minVariancePortfolio, setMinVariancePortfolio] = useState({});
    const [efficientPortfolio, setEfficientPortfolio] = useState({});
    const [riskTolerance, setRiskTolerance] = useState(0);

    const addStock = () => {
        setStocks([...stocks, ""]); // Add an empty stock (to be selected)
    };

    const removeStock = (index) => {
        if (stocks.length > 1) {
            setStocks(stocks.filter((_, i) => i !== index));
        }
    };

    const updateStock = (index, newStock) => {
        const updatedStocks = [...stocks];
        updatedStocks[index] = newStock;
        setStocks(updatedStocks);
    };

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

    const getToDate = () => {
        let toDate = new Date();
        const todaysDate = new Date();
        toDate.setDate(todaysDate.getDate());

        return toDate.toISOString().split("T")[0];
    }

    function fetchData() {
        //fetch data for all stocks (already reversed from oldest to newest)
        fetchMultipleStocks(setLoading, setError, stocks, getStartDate(), getToDate(), setStockData);
    }

    useEffect(() => {
        if (stockData.length > 0) {
            //print out data to see format
            console.log(stockData);
            let response = runEfficientFrontierAnalysis(stockData);
            setPortfolios(response[0]);
            setMinVariancePortfolio(response[1]);
        } else {
            console.log("There is no data to print anything");
        }
    }, [stockData])

    useEffect(() => {
        if (portfolios.length > 0) {
            setRisks(portfolios.map(portfolio => portfolio["risk"]));
            setReturns(portfolios.map(portfolio => portfolio["return"]));
        }
    }, [portfolios])

    function findRiskAppropiratePortfolio() {
        //get portfolio
        let riskAppropriatePortfolio = findEfficientPortfolio(portfolios, riskTolerance);
        setEfficientPortfolio(riskAppropriatePortfolio);
    }

    useEffect(() => {
        console.log(Object.keys(efficientPortfolio));
    }, [efficientPortfolio])

    return (
        <div className="main-container">
            {/* LEFT PANE: Input Panel */}
            <div className="left-pane">
                {/* Content Based on Active Tab */}
                <div className="input-container">
                    <h2>Efficient Frontier</h2>
                    {stocks.map((stock, index) => (
                        <div key={index} className="stock-selection">
                            <DropdownFromCSV
                                csvFile={"/data/tickerData_NSE.csv"}
                                dropdownName={`stockDropdown-${index}`}
                                value={stock}
                                onChange={(e) => updateStock(index, e.target.value)}
                            />
                            <button
                                onClick={() => removeStock(index)}
                                disabled={stocks.length === 1}
                                className="delete-btn"
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    <button onClick={addStock} className="add-stock-btn">+ Add Stock</button>
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                        <option value="1week">Past Week</option>
                        <option value="1month">Past Month</option>
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

                {/* PORTFOLIO GRAPH */}
                {risks.length > 0 && returns.length > 0 && (
                    <>
                        <h2>Monte Carlo Simulation</h2>
                        <XYChart xData={risks} xLabel="Risk" yData={returns} yLabel="Returns (%)" />

                        <h2>Minimum Risk Portfolio</h2>
                        <p>{`Average Daily Return: ${minVariancePortfolio["return"].toFixed(2)} %`}</p>
                        <p>{`Risk: ${minVariancePortfolio["risk"].toFixed(2)}`}</p>
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>Stock</th>
                                    <th>Weight</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stocks.map((item, index) => (
                                    <tr key={index}>
                                        <td>{stocks[index]}</td>
                                        <td>{`${(minVariancePortfolio["weights"][index] * 100).toFixed(2)} %`}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <h2>Risk Tolerance</h2>
                        <div className="risk-tolerance-container">
                            <input
                                id="riskToleranceInput"
                                type="number"
                                placeholder="Enter max risk"
                                value={riskTolerance}
                                onChange={(e) => setRiskTolerance(e.target.value)}
                                className="styled-input"
                            />
                            <button onClick={() => findRiskAppropiratePortfolio()} className="styled-button">Find Best Portfolio</button>
                        </div>
                    </>
                )}

                {Object.keys(efficientPortfolio).length > 0 && (
                    <>
                        <h3>Risk Appropriate Portfolio</h3>
                        <p>{`Average Daily Return: ${efficientPortfolio["return"].toFixed(2)} %`}</p>
                        <p>{`Risk: ${efficientPortfolio["risk"].toFixed(2)}`}</p>
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>Stock</th>
                                    <th>Weight</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stocks.map((item, index) => (
                                    <tr key={index}>
                                        <td>{stocks[index]}</td>
                                        <td>{`${(efficientPortfolio["weights"][index] * 100).toFixed(2)} %`}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div >
    );
};

export default EfficientFrontier;
