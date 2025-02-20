import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

const DualLineChart = ({ dataA, dataB }) => {
    // Prepare Data for Graph
    const chartData = dataA.map((item, index) => ({
        date: item.date.split("T")[0], // X-Axis (Date)
        priceA: item.close, // First Data Set (Price A)
        priceB: dataB[index] ? (dataB[index]).toFixed(2) : null, // Second Data Set (Price B)
    }));


    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ left: 35 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" label={{ value: "Date", position: "insideBottom", offset: -30 }} tickMargin={20} interval="preserveEnd" />
                <YAxis label={{ value: "Price (₹)", angle: -90, position: "insideLeft", offset: -25 }} tickCount={10} domain={["auto", "auto"]} tickMargin={10} />
                <Tooltip />
                <Legend wrapperStyle={{
                    paddingTop: "40px",
                    left: 0
                }} />
                {/* First Data Line - Blue */}
                <Line type="monotone" dataKey="priceA" stroke="#007bff" name="Acutal Price" strokeWidth={2} dot={false} />
                {/* Second Data Line - Red */}
                <Line type="monotone" dataKey="priceB" stroke="#ff0000" name="Predicted Price" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default DualLineChart;