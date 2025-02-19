import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Menu Button (☰) - Should be Outside */}
            <button className="menu-button" onClick={toggleSidebar}>
                ☰
            </button>

            {/* Sidebar Menu */}
            <div className={`sidebar ${isOpen ? "open" : ""}`}>
                <button className="close-button" onClick={toggleSidebar}>×</button>
                <h2 className="menu-title">Menu</h2>
                <ul className="menu-list">
                    <li><Link to="/stockData" onClick={toggleSidebar}>Stock Data</Link></li>
                    <li><Link to="/stockCorrelation" onClick={toggleSidebar}>Stock Correlation</Link></li>
                    <li><Link to="/stockPrediction" onClick={toggleSidebar}>Stock Prediction</Link></li>
                </ul>
            </div>

            {/* Click outside to close */}
            {isOpen && <div className="overlay" onClick={toggleSidebar}></div>}
        </>
    );
};

export default Sidebar;
