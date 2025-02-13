export const calculateBeta = (historicalData, marketData) => {

    if (!historicalData.length || !marketData.length) {
        console.warn("Insufficient data to calculate Beta.");
        return;
    }

    // Ensure both datasets have the same length
    const minLength = Math.min(historicalData.length, marketData.length);
    const stockDataTrimmed = historicalData.slice(-minLength); // Take last `minLength` entries
    const marketDataTrimmed = marketData.slice(-minLength);

    // Compute daily returns
    const stockReturns = stockDataTrimmed.map((d, i, arr) =>
        i > 0 ? (d.close - arr[i - 1].close) / arr[i - 1].close : 0
    ).slice(1); // Remove first undefined return

    const marketReturns = marketDataTrimmed.map((d, i, arr) =>
        i > 0 ? (d.close - arr[i - 1].close) / arr[i - 1].close : 0
    ).slice(1);

    if (stockReturns.length !== marketReturns.length) {
        console.warn("Data mismatch after trimming. Cannot calculate Beta.");
        return;
    }

    // Compute mean returns
    const meanStock = stockReturns.reduce((a, b) => a + b, 0) / stockReturns.length;
    const meanMarket = marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < stockReturns.length; i++) {
        covariance += (stockReturns[i] - meanStock) * (marketReturns[i] - meanMarket);
        marketVariance += (marketReturns[i] - meanMarket) ** 2;
    }

    return (covariance / marketVariance);
}

export const calculateVolatility = (stockData) => {
    if (stockData.length < 2) return 0; // Not enough data

    // Step 1: Compute daily returns
    const returns = stockData.map((d, i, arr) =>
        i > 0 ? (d.close - arr[i - 1].close) / arr[i - 1].close : 0
    ).slice(1); // Remove first element (undefined return)

    // Step 2: Calculate Mean Return
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Step 3: Compute Variance (Sum of squared deviations from mean)
    const variance = returns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / returns.length;

    // Step 4: Standard Deviation (Volatility)
    const volatility = Math.sqrt(variance);

    // Convert to percentage (Annualized if needed)
    return ((volatility * 100).toFixed(2)); // Returns as a percentage
}

export const calculateRSI = (stockData, period = 14) => {
    if (stockData.length < period) return null; // Not enough data

    let gains = [];
    let losses = [];

    // Step 1: Compute daily changes
    for (let i = 1; i < stockData.length; i++) {
        let change = stockData[i].close - stockData[i - 1].close;
        if (change > 0) {
            gains.push(change);
            losses.push(0);
        } else {
            gains.push(0);
            losses.push(Math.abs(change));
        }
    }

    // Step 2: Compute the initial Average Gain & Loss (Simple Moving Average)
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // Step 3: Compute RSI using the Smoothed Moving Average
    for (let i = period; i < gains.length; i++) {
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    }

    // Step 4: Compute RS & RSI
    let RS = avgLoss === 0 ? 100 : avgGain / avgLoss; // Prevent division by zero
    let RSI = 100 - (100 / (1 + RS));

    return (RSI.toFixed(2)); // Round to 2 decimal places
}