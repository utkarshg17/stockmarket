import React from "react";
import { Scatter } from "react-chartjs-2";
import { Chart, LinearScale, PointElement, Title, Tooltip, Legend } from "chart.js";

// Register required Chart.js components
Chart.register(LinearScale, PointElement, Title, Tooltip, Legend);

const ScatterPlot = ({ xData, xLabel, yData, yLabel }) => {
    // Convert xData & yData into Scatter Plot format [{x: value, y: value}, ...]
    const scatterData = xData.map((x, index) => ({
        x: x,
        y: yData[index],
    }));

    const chartData = {
        datasets: [
            {
                label: `${yLabel} vs ${xLabel}`,
                data: scatterData,
                backgroundColor: "#007bff",
                pointRadius: 2, // Size of points
                pointHoverRadius: 7, // Size when hovered
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
            legend: { display: false },
        },
    };

    return (
        <div style={{ height: "500px", width: "100%" }}>
            <Scatter data={chartData} options={options} />
        </div>
    );
};

export default ScatterPlot;