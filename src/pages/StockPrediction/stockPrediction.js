/* global tf */

export async function createModel() {
    const model = tf.sequential();

    // LSTM Layer for time-series forecasting
    model.add(tf.layers.lstm({ units: 50, returnSequences: true, inputShape: [30, 1] }));
    model.add(tf.layers.lstm({ units: 50, returnSequences: false }));
    model.add(tf.layers.dense({ units: 1 })); // Output layer

    model.compile({ optimizer: "adam", loss: "meanSquaredError" });

    return model;
}

export async function trainModel(model, stockData) {
    const xs = [];
    const ys = [];

    // Prepare training data (30-day windows)
    for (let i = 0; i < stockData.length - 30; i++) {
        xs.push(stockData.slice(i, i + 30)); // Input sequence
        ys.push(stockData[i + 30]); // Next day's price
    }

    // Convert to TensorFlow tensors
    const xsTensor = tf.tensor3d(xs, [xs.length, 30, 1]);
    const ysTensor = tf.tensor2d(ys, [ys.length, 1]);

    // Train model
    await model.fit(xsTensor, ysTensor, { epochs: 10 });

    return model;
}

export async function predictNextPrice(model, last30Days) {
    const inputTensor = tf.tensor3d([last30Days], [1, 30, 1]);
    const prediction = model.predict(inputTensor);
    return prediction.dataSync()[0]; // Extract value
}

// Load historical stock data and train the model
export async function runStockPrediction(historicalPrices) {
    const model = await createModel();
    await trainModel(model, historicalPrices);
    const nextPrice = await predictNextPrice(model, historicalPrices.slice(-30));
    console.log("Predicted next stock price:", nextPrice);
    return nextPrice;
}