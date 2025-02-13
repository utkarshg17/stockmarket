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

export const calculateCorrelation = (stockData1, stockData2) => {
    if (!stockData1 || !stockData2 || stockData1.length < 2 || stockData2.length < 2) {
        console.warn("Insufficient data to calculate correlation.");
        return null;
    }

    // Ensure both datasets have the same length
    const minLength = Math.min(stockData1.length, stockData2.length);
    const stock1Trimmed = stockData1.slice(-minLength);
    const stock2Trimmed = stockData2.slice(-minLength);

    // Compute daily returns
    const returns1 = [];
    const returns2 = [];

    for (let i = 1; i < minLength; i++) {
        returns1.push((stock1Trimmed[i].close - stock1Trimmed[i - 1].close) / stock1Trimmed[i - 1].close);
        returns2.push((stock2Trimmed[i].close - stock2Trimmed[i - 1].close) / stock2Trimmed[i - 1].close);
    }

    // Ensure lengths match
    if (returns1.length !== returns2.length) {
        console.warn("Data mismatch after trimming. Cannot calculate correlation.");
        return null;
    }

    // Compute mean returns
    const mean1 = returns1.reduce((a, b) => a + b, 0) / returns1.length;
    const mean2 = returns2.reduce((a, b) => a + b, 0) / returns2.length;

    // Compute covariance and standard deviations
    let covariance = 0;
    let stdDev1 = 0;
    let stdDev2 = 0;

    for (let i = 0; i < returns1.length; i++) {
        covariance += (returns1[i] - mean1) * (returns2[i] - mean2);
        stdDev1 += (returns1[i] - mean1) ** 2;
        stdDev2 += (returns2[i] - mean2) ** 2;
    }

    // Normalize by (n - 1) to prevent bias
    covariance /= (returns1.length - 1);
    stdDev1 = Math.sqrt(stdDev1 / (returns1.length - 1));
    stdDev2 = Math.sqrt(stdDev2 / (returns2.length - 1));

    // Compute correlation coefficient
    const correlation = stdDev1 * stdDev2 === 0 ? null : (covariance / (stdDev1 * stdDev2)).toFixed(2);

    return correlation;
};

export const calculateCorrelationReturns = (stockData1, stockData2) => {
    if (!stockData1 || !stockData2 || stockData1.length === 0 || stockData2.length === 0) {
        alert("Please fetch stock data first.");
        return;
    }

    // Compute returns for scatter plot
    const minLength = Math.min(stockData1.length, stockData2.length);
    const returns1 = [];
    const returns2 = [];

    for (let i = 1; i < minLength; i++) {
        returns1.push((stockData1[i].close - stockData1[i - 1].close) / stockData1[i - 1].close);
        returns2.push((stockData2[i].close - stockData2[i - 1].close) / stockData2[i - 1].close);
    }

    return ([returns1, returns2])
};