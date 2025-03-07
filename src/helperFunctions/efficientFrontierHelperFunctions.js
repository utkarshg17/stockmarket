function cleanStockData(stockData) {
    //find the length of min data
    let dataSizes = [];
    stockData.map((stockObject, index) => {
        dataSizes[index] = stockObject["data"].length;
    })
    let minDataSize = Math.min(...dataSizes);
    //trim each of dataset to the min amount
    let newStockData = stockData.map(stockDataObject => ({
        ...stockDataObject, data: stockDataObject["data"].slice(0, minDataSize)
    }));
    //return new stock data
    return newStockData
}

function calculateReturns(stockData) {
    let returnsData = {};

    Object.keys(stockData).forEach((stock, index) => {
        //get closing prices for stock
        let symbol = stockData[index]["symbol"];
        let data = stockData[index]["data"];
        let closingPrices = [];
        data.map((dataPoint, index) => {
            closingPrices[index] = dataPoint["close"]
        });
        //calculate returns
        let returns = [];

        for (let i = 1; i < closingPrices.length; i++) {
            let dailyReturn = (closingPrices[i] - closingPrices[i - 1]) / closingPrices[i - 1];
            returns.push(dailyReturn * 100);
        }

        returnsData[symbol] = returns;
    });

    return returnsData;
}

function calculateMeanReturns(returnsData) {
    let meanReturns = {};

    Object.keys(returnsData).forEach(symbol => {
        let returns = returnsData[symbol];
        meanReturns[symbol] = returns.reduce((acc, val) => acc + val, 0) / returns.length;
    });

    return meanReturns;
}

function calculateCovarianceMatrix(returnsData) {
    let symbols = Object.keys(returnsData);
    let numStocks = symbols.length;
    let covarianceMatrix = Array(numStocks).fill().map(() => Array(numStocks).fill(0));

    for (let i = 0; i < numStocks; i++) {
        for (let j = 0; j < numStocks; j++) {
            let stock1 = symbols[i];
            let stock2 = symbols[j];

            let mean1 = calculateMeanReturns(returnsData)[stock1];
            let mean2 = calculateMeanReturns(returnsData)[stock2];

            let covariance = 0;
            let count = returnsData[stock1].length;

            for (let k = 0; k < count; k++) {
                covariance += (returnsData[stock1][k] - mean1) * (returnsData[stock2][k] - mean2);
            }

            covariance /= count;
            covarianceMatrix[i][j] = covariance;
        }
    }

    return covarianceMatrix;
}

function generateRandomPortfolio(symbols, meanReturns, covarianceMatrix, numPortfolios = 5000) {
    let results = [];
    let bestSharpeRatio = -Infinity;
    let bestPortfolio = null;

    for (let i = 0; i < numPortfolios; i++) {
        // Generate random weights
        let weights = Array(symbols.length).fill(0).map(() => Math.random());
        let weightSum = weights.reduce((a, b) => a + b, 0);
        weights = weights.map(w => w / weightSum);

        // Calculate portfolio return
        let portfolioReturn = symbols.reduce((acc, symbol, idx) => acc + weights[idx] * meanReturns[symbol], 0);

        // Calculate portfolio risk (standard deviation)
        let portfolioVariance = 0;
        for (let x = 0; x < symbols.length; x++) {
            for (let y = 0; y < symbols.length; y++) {
                portfolioVariance += weights[x] * weights[y] * covarianceMatrix[x][y];
            }
        }
        let portfolioRisk = Math.sqrt(portfolioVariance);

        // Calculate Sharpe Ratio (assume risk-free rate = 0)
        let sharpeRatio = portfolioReturn / portfolioRisk;

        // Store results
        results.push({
            weights,
            return: portfolioReturn,
            risk: portfolioRisk,
            sharpeRatio
        });

        // Identify best portfolio based on Sharpe Ratio
        if (sharpeRatio > bestSharpeRatio) {
            bestSharpeRatio = sharpeRatio;
            bestPortfolio = { weights, return: portfolioReturn, risk: portfolioRisk };
        }
    }

    return { portfolios: results, bestPortfolio };
}

function findMinVariancePortfolio(portfolios) {
    return portfolios.reduce((min, portfolio) => (portfolio.risk < min.risk ? portfolio : min), portfolios[0]);
}

export function runEfficientFrontierAnalysis(stockData) {
    let cleanData = cleanStockData(stockData);
    let returnsData = calculateReturns(cleanData);
    let meanReturns = calculateMeanReturns(returnsData);
    let covarianceMatrix = calculateCovarianceMatrix(returnsData);

    let symbols = Object.keys(returnsData);

    let { portfolios, bestPortfolio } = generateRandomPortfolio(symbols, meanReturns, covarianceMatrix);
    let minVariancePortfolio = findMinVariancePortfolio(portfolios);
    console.log(minVariancePortfolio);

    return [portfolios, minVariancePortfolio];
}
