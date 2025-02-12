import React from "react";
import { Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

// Register required Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const StockChart = ({ dates, prices }) => {
    // Reverse the arrays so oldest date appears first
    const reversedDates = [...dates].reverse();

    const chartData = {
        labels: reversedDates, // Dates (X-Axis)
        datasets: [
            {
                label: "Stock Price (₹)",
                data: prices, // Prices (Y-Axis)
                borderColor: "#007bff",
                backgroundColor: "rgba(0, 123, 255, 0.2)",
                borderWidth: 2,
                tension: 0.3, // Smooth Line
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: "Date" } },
            y: { title: { display: true, text: "Stock Price (₹)" }, beginAtZero: false },
        },
    };

    return (
        <div style={{ height: "300px", margin: "20px 0" }}>
            <Line data={chartData} options={options} />
        </div>
    );
};

export default StockChart;