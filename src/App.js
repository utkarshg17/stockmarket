import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import StockData from "./pages/StockData/StockData";
import StockCorrelation from "./pages/StockCorrelation/StockCorrelation";
import Predict from "./pages/StockPrediction/Predict";

const App = () => {
    return (
        <Router>
            <Sidebar /> {/* Sidebar is always visible */}
            <div className="content">
                <Routes>
                    <Route path="/stockData" element={<StockData />} />
                    <Route path="/stockCorrelation" element={<StockCorrelation />} />
                    <Route path="/stockPrediction" element={<Predict />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
