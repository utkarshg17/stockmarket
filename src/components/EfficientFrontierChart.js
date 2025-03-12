import React from "react";
import { Scatter } from "react-chartjs-2";
import { Chart, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import * as regression from "regression"; // Import regression library

// Register required Chart.js components
Chart.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const EfficientFrontierChart = ({ xData, xLabel, yData, yLabel }) => {
    // Convert xData & yData into Scatter Plot format [{x: value, y: value}, ...]
    let scatterData = xData.map((x, index) => ({
        x: x,
        y: yData[index],
    }));

    // Step 1: Sort portfolios by increasing risk
    let sortedData = [...scatterData].sort((a, b) => a.x - b.x);

    // Step 2: Construct the Efficient Frontier (Only the best portfolios)
    let efficientFrontierData = [];
    let maxReturn = -Infinity;

    for (let i = 0; i < sortedData.length; i++) {
        if (sortedData[i].y > maxReturn) {
            maxReturn = sortedData[i].y;
            efficientFrontierData.push(sortedData[i]); // Only keep optimal points
        }
    }

    console.log(efficientFrontierData);

    // Step 3: Perform Polynomial Regression (Degree 3)
    const regressionInput = efficientFrontierData.map(point => [point.x, point.y]);
    const polynomialRegression = regression.power(regressionInput, { order: 5 });

    console.log(polynomialRegression);

    // Step 4: Generate points using the regression equation
    const minRisk = efficientFrontierData[0].x;
    const maxRisk = efficientFrontierData[efficientFrontierData.length - 1].x;
    let smoothFrontier = [];

    for (let risk = minRisk; risk <= maxRisk; risk += 0.0001) {
        let predictedReturn = polynomialRegression.predict(risk)[1]; // Evaluate polynomial equation
        smoothFrontier.push({ x: risk, y: predictedReturn });
    }

    console.log(smoothFrontier);

    const chartData = {
        datasets: [
            {
                label: `${yLabel} vs ${xLabel}`,
                data: scatterData,
                backgroundColor: "#007bff",
                pointRadius: 2,
                pointHoverRadius: 7,
            },
            {
                label: "Efficient Frontier (Smoothed)",
                data: smoothFrontier, // Use regression equation to generate this
                borderColor: "green",
                borderWidth: 2,
                showLine: true,
                fill: false,
                pointRadius: 0, // Hide individual points
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: xLabel } },
            y: { title: { display: true, text: yLabel } },
        },
        plugins: {
            legend: { display: true },
        },
    };

    return (
        <div style={{ height: "500px", width: "100%" }}>
            <Scatter data={chartData} options={options} />
        </div>
    );
};

export default EfficientFrontierChart;
