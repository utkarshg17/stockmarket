import React, { useState, useEffect } from "react";
import Papa from "papaparse";

const DropdownFromCSV = ({ csvFile, dropdownName }) => {
    const [options, setOptions] = useState([]);

    useEffect(() => {
        const fetchCSV = async () => {
            try {
                const response = await fetch(csvFile);
                const reader = await response.text();
                const parsedData = Papa.parse(reader, { header: true }).data;

                // Extract the first column (Modify based on your CSV structure)
                const dropdownOptions = parsedData.map(row => row.Symbol);
                setOptions(dropdownOptions);
            } catch (error) {
                console.error("Error reading CSV:", error);
            }
        };

        fetchCSV();
    }, [csvFile]);

    return (
        <select name={dropdownName}>
            <option value="">Select an option</option>
            {options.map((option, index) => (
                <option key={index} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
};

export default DropdownFromCSV;
