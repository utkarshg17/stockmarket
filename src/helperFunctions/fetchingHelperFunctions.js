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

export const fetchMultipleStocks = async (setLoading, setError, symbols, startDate, endDate, setStockData) => {
    if (!symbols || symbols.length === 0) return alert("Enter at least one stock symbol!");

    setLoading(true);
    setError(null);

    let stockDataArray = [];

    try {
        for (let symbol of symbols) {
            try {
                const response = await axios.get(BASE_URL, {
                    params: {
                        access_key: API_KEY,
                        symbols: symbol,
                        date_from: startDate,
                        date_to: endDate,
                        limit: 2000
                    },
                });

                if (!response.data || !response.data.data || response.data.data.length === 0) {
                    console.warn(`No data found for ${symbol}`);
                    continue; // Skip this stock if no data is found
                }

                stockDataArray.push({
                    symbol,
                    data: [...response.data.data.slice(0, 2000)].reverse() // Limiting records
                });

                console.log(`Fetched data for ${symbol}`);

                // Introduce a small delay between requests (optional, useful if API has rate limits)
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`Error fetching data for ${symbol}:`, error);
            }
        }

        if (stockDataArray.length === 0) {
            setError("Failed to fetch data for all stocks.");
        }

        setStockData(stockDataArray);

    } catch (err) {
        setError("Failed to fetch historical data. Try again.");
        console.error(err);
    }

    setLoading(false);
};