import React from "react";
import { Scatter, Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

// Register required Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const calculateRegressionLine = (xValues, yValues) => {
    const n = xValues.length;
    if (n < 2) return null; // Ensure we have enough data

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    // Compute slope (m) and intercept (b)
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    // Generate regression line points
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const regressionPoints = [
        { x: minX, y: m * minX + b },
        { x: maxX, y: m * maxX + b },
    ];

    return regressionPoints;
};

const CorrelationChart = ({ stockReturns1, stockReturns2 }) => {
    if (!stockReturns1 || !stockReturns2 || stockReturns1.length !== stockReturns2.length) {
        return <p>Invalid data for correlation plot.</p>;
    }

    // Format data for scatter plot
    const scatterData = stockReturns1.map((x, i) => ({
        x: x,  // Stock 1 returns (X-Axis)
        y: stockReturns2[i] // Stock 2 returns (Y-Axis)
    }));

    // Compute regression line points
    const regressionLine = calculateRegressionLine(stockReturns1, stockReturns2);

    const chartData = {
        datasets: [
            {
                label: "Stock Correlation",
                data: scatterData,
                backgroundColor: "rgba(255, 99, 132, 0.6)",
                pointRadius: 4,
            },
            regressionLine && {
                label: "Regression Line",
                data: regressionLine,
                type: "line",
                borderColor: "blue",
                borderWidth: 2,
                fill: false,
                pointRadius: 0, // Hide points on trendline
            },
        ].filter(Boolean), // Remove null datasets
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: "Stock 1 Returns" } },
            y: { title: { display: true, text: "Stock 2 Returns" } },
        },
        plugins: {
            legend: { display: true }
        }
    };

    return (
        <div style={{ height: "300px", margin: "20px 0" }}>
            <Scatter data={chartData} options={options} />
        </div>
    );
};

export default CorrelationChart;