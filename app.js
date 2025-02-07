require("dotenv").config();
const axios = require("axios");

const BASE_URL = "http://api.marketstack.com/v1";

/**
 * Fetch real-time stock market data
 * @param {string} stockSymbol - The stock symbol (e.g., "RELIANCE" for NSE)
 * @param {string} exchange - The exchange (e.g., "XNSE" for NSE, "XBOM" for BSE)
 */
async function getStockData(stockSymbol, exchange = "XNSE") {
    try {
        const response = await axios.get(`${BASE_URL}/eod`, {
            params: {
                access_key: process.env.MARKETSTACK_API_KEY,
                symbols: `${stockSymbol}.${exchange}`, // MarketStack format
                limit: 1, // Fetch latest data
            },
        });

        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching stock data:", error.response ? error.response.data : error.message);
    }
}

// Example usage
(async () => {
    await getStockData("RELIANCE", "XNSE"); // Fetch NSE Reliance stock data
})();