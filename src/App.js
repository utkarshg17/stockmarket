import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import StockData from "./pages/StockData/StockData";
import StockCorrelation from "./pages/StockCorrelation/StockCorrelation";

const App = () => {
    return (
        <Router>
            <Sidebar /> {/* Sidebar is always visible */}
            <div className="content">
                <Routes>
                    <Route path="/stockData" element={<StockData />} />
                    <Route path="/stockCorrelation" element={<StockCorrelation />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
