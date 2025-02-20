import axios from "axios";
const API_KEY = "9630ecf1d09165b08ad3621ec7efb550";
const BASE_URL = "http://api.marketstack.com/v1/eod";

export const fetchIndexData = async (MARKET_INDEX, startDate, endDate, setError, setIndexData) => {
    try {
        const response = await axios.get(BASE_URL, {
            params: {
                access_key: API_KEY,
                symbols: `${MARKET_INDEX}`, // Fetch NIFTY 50 Data
                date_from: startDate,
                date_to: endDate,
                limit: 2000
            },
        });

        if (!response.data || !response.data.data || response.data.data.length === 0) {
            setError("No market data found.");
            return;
        }

        setIndexData(response.data.data.slice(0, 2000)); // Oldest data first
    } catch (err) {
        setError("Failed to fetch market data.");
        console.error(err);
    }
};

export const fetchStockData = async (setLoading, setError, symbol, startDate, endDate, setStockData) => {
    if (!symbol) return alert("Enter a stock symbol!");
    setLoading(true);
    setError(null);

    try {
        const response = await axios.get(BASE_URL, {
            params: {
                access_key: API_KEY,
                symbols: `${symbol}`,
                date_from: startDate,
                date_to: endDate,
                limit: 2000
            },
        });

        if (!response.data || !response.data.data || response.data.data.length === 0) {
            setError("No data found. Please try another stock.");
            setLoading(false);
            return;
        }

        setStockData(response.data.data.slice(0, 2000)); // Limit to last 10 records
    } catch (err) {
        setError("Failed to fetch historical data. Try again.");
        console.error(err);
    }

    setLoading(false);
};