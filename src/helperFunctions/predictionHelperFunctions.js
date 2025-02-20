/* global tf */

export async function predictStockData(setProgress, setPredictions, setTrainingStatus, historicalData, marketData, nasdaqData, predictionTimeline) {
    console.log("Prediciton Started");

    setProgress(0);
    setPredictions([]);

    historicalData = [...historicalData].reverse();
    marketData = [...marketData].reverse(); // Ensure market data is in the same order
    nasdaqData = [...nasdaqData].reverse();

    let { openingPrices, closingPrices, volumes, highPrices, lowPrices, marketCloses, nasdaqCloses } = await fetchStockData(historicalData, marketData, nasdaqData);

    // Normalize all six features separately
    let { normalized: normalizedOpen, min: minOpen, max: maxOpen } = normalize(openingPrices);
    let { normalized: normalizedClose, min: minClose, max: maxClose } = normalize(closingPrices);
    let { normalized: normalizedVolumes, min: minVol, max: maxVol } = normalize(volumes);
    let { normalized: normalizedHigh, min: minHigh, max: maxHigh } = normalize(highPrices);
    let { normalized: normalizedLow, min: minLow, max: maxLow } = normalize(lowPrices);
    let { normalized: normalizedMarket, min: minMarket, max: maxMarket } = normalize(marketCloses);
    let { normalized: normalizedNASDAQ, min: minNASDAQ, max: maxNASDAQ } = normalize(nasdaqCloses);

    let seqLength = 5;
    let { inputs, labels } = createSequences(normalizedOpen, normalizedClose, normalizedVolumes, normalizedHigh, normalizedLow, normalizedMarket, normalizedNASDAQ, seqLength);

    let model = await trainModel(setProgress, setTrainingStatus, inputs, labels);

    extractFeatureWeights(model);

    let lastSequence = normalizedClose.slice(-seqLength).map((val, idx) => [
        normalizedOpen[normalizedOpen.length - seqLength + idx],
        val,
        normalizedVolumes[normalizedVolumes.length - seqLength + idx],
        normalizedHigh[normalizedHigh.length - seqLength + idx],
        normalizedLow[normalizedLow.length - seqLength + idx],
        normalizedMarket[normalizedMarket.length - seqLength + idx],
        normalizedNASDAQ[normalizedNASDAQ.length - seqLength + idx]
    ]);

    let nextNDayPrices = await predictNextNDays(model, lastSequence, minOpen, maxOpen, minClose, maxClose, minVol, maxVol, minHigh, maxHigh, minLow, maxLow, minMarket, maxMarket, minNASDAQ, maxNASDAQ, predictionTimeline);

    console.log(nextNDayPrices);

    setPredictions(nextNDayPrices);
}

async function fetchStockData(historicalData, marketData, nasdaqData) {
    let openingPrices = historicalData.map(d => d.open);
    let closingPrices = historicalData.map(d => d.close);
    let volumes = historicalData.map(d => d.volume);
    let highPrices = historicalData.map(d => d.high);
    let lowPrices = historicalData.map(d => d.low);
    let marketCloses = marketData.map(d => d.close); // Market close prices
    let nasdaqCloses = nasdaqData.map(d => d.close); //nasdaq data

    // Trim datasets to the length of the shorter one
    let minLength = Math.min(openingPrices.length, marketCloses.length, nasdaqCloses.length);

    return {
        openingPrices: openingPrices.slice(0, minLength),
        closingPrices: closingPrices.slice(0, minLength),
        volumes: volumes.slice(0, minLength),
        highPrices: highPrices.slice(0, minLength),
        lowPrices: lowPrices.slice(0, minLength),
        marketCloses: marketCloses.slice(0, minLength),
        nasdaqCloses: nasdaqCloses.slice(0, minLength)
    };
}

function normalize(data) {
    let min = Math.min(...data);
    let max = Math.max(...data);
    let normalized = data.map(value => (value - min) / (max - min)); // Normalize between 0-1
    return { normalized, min, max };
}

function createSequences(openPrices, closePrices, volumes, highPrices, lowPrices, marketCloses, nasdaqCloses, sequenceLength) {
    let inputs = [];
    let labels = [];

    for (let i = 0; i < closePrices.length - sequenceLength; i++) {
        let seq = [];
        for (let j = 0; j < sequenceLength; j++) {
            seq.push([
                openPrices[i + j],
                closePrices[i + j],
                volumes[i + j],
                highPrices[i + j],
                lowPrices[i + j],
                marketCloses[i + j],  // ✅ Adding Market Data
                nasdaqCloses[i + j] // adding nasdaq data
            ]);
        }
        let label = [closePrices[i + sequenceLength]]; // Predicting next day's closing price

        inputs.push(seq);
        labels.push(label);
    }

    return {
        inputs: tf.tensor3d(inputs, [inputs.length, sequenceLength, 7]),  // Shape: (batch, sequence, features)
        labels: tf.tensor2d(labels, [labels.length, 1])  // Shape: (batch, 1)
    };
}

async function trainModel(setProgress, setTrainingStatus, inputs, labels) {
    const model = tf.sequential();

    model.add(tf.layers.lstm({
        units: 50, returnSequences: false, inputShape: [inputs.shape[1], 7]  // Updated to use 5 features
    }));

    model.add(tf.layers.dense({ units: 1 }));

    model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
    });

    let epochs = 50;

    // Callback to update training progress
    const progressCallback = {
        onEpochEnd: (epoch, logs) => {
            let progress = Math.round(((epoch + 1) / epochs) * 100);
            setProgress(progress); // Update progress state
            setTrainingStatus(`Training Progress: ${progress}%`);
        }
    };

    await model.fit(inputs, labels, {
        epochs: 50,
        batchSize: 8,
        callbacks: progressCallback
    });

    setTrainingStatus("Training Complete!");
    return model;
}

function extractFeatureWeights(model) {
    let lstmWeights = model.layers[0].getWeights()[0];  // LSTM weight matrix
    let weightsArray = lstmWeights.arraySync();  // Convert to JS array

    let featureImportance = weightsArray.map((weights, index) => ({
        feature: `Feature_${index}`,  // Feature index
        importance: Math.abs(weights.reduce((sum, w) => sum + Math.abs(w), 0))  // Sum of absolute weights
    }));

    console.log("Feature Importance based on Weights:", featureImportance);
    return featureImportance;
}

async function predictNextPrice(model, lastSequence, minClose, maxClose) {
    let inputTensor = tf.tensor3d([lastSequence], [1, lastSequence.length, 7]); // ✅ Now using 6 features
    let prediction = model.predict(inputTensor);
    let predictedValue = prediction.dataSync()[0]; // Convert tensor to number

    // Denormalize closing price
    let actualPrice = (predictedValue * (maxClose - minClose)) + minClose;

    return actualPrice;
}

async function predictNextNDays(model, lastSequence, minOpen, maxOpen, minClose, maxClose, minVol, maxVol, minHigh, maxHigh, minLow, maxLow, minMarket, maxMarket, minNASDAQ, maxNASDAQ, days) {
    let futurePredictions = [];

    for (let i = 0; i < days; i++) {
        let predictedClose = await predictNextPrice(model, lastSequence, minClose, maxClose);
        futurePredictions.push(predictedClose);

        // Update sequence: Remove first entry, append new prediction
        let lastDayOpen = lastSequence[lastSequence.length - 1][0];
        let lastDayVolume = lastSequence[lastSequence.length - 1][2];
        let lastDayHigh = lastSequence[lastSequence.length - 1][3];
        let lastDayLow = lastSequence[lastSequence.length - 1][4];
        let lastDayMarketClose = lastSequence[lastSequence.length - 1][5];
        let lastDayNASDAQClose = lastSequence[lastSequence.length - 1][6]
        let normalizedPredictedClose = (predictedClose - minClose) / (maxClose - minClose);

        lastSequence = [...lastSequence.slice(1), [lastDayOpen, normalizedPredictedClose, lastDayVolume, lastDayHigh, lastDayLow, lastDayMarketClose, lastDayNASDAQClose]];
    }

    return futurePredictions;
}