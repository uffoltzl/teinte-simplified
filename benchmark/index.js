// @ts-check

const { benchmark } = require("./benchmark");
const { interpolateColor } = require("../index.instrumented.cjs");
const fs = require("fs");

// Define stuff
benchmark.addMark("Calibration (start)");
benchmark.addMark("Calibration (end)");
benchmark.addMark("Begin");
benchmark.addMark("End");

benchmark.addFlow("Calibration", "Calibration (start)", "Calibration (end)");
benchmark.addFlow("Full", "Begin", "End");

// Run becnhmark

let WARMUP_EXAMPLES = 1000;
let RECORDING_EXAMPLES = 10000;

const randomBetween = (/** @type {number} */ min, /** @type {number} */ max) => {
  return Math.round(Math.random() * (max - min) + min);
};

const RGB_MIN = 0;
const RGB_MAX = 255;
const EXTRA_GAMMUT = 60;

function randomColor() {
  return {
    r: randomBetween(RGB_MIN - EXTRA_GAMMUT, RGB_MAX + EXTRA_GAMMUT),
    g: randomBetween(RGB_MIN - EXTRA_GAMMUT, RGB_MAX + EXTRA_GAMMUT),
    b: randomBetween(RGB_MIN - EXTRA_GAMMUT, RGB_MAX + EXTRA_GAMMUT),
  };
}

function randomRatio() {
  return Math.random();
}

benchmark.benchmark(
  () => {
    const color1 = randomColor();
    const color2 = randomColor();

    const ratio = randomRatio();

    benchmark.recordMark("Calibration (start)");
    benchmark.recordMark("Calibration (end)");

    interpolateColor(color1, color2, ratio);
  },
  WARMUP_EXAMPLES,
  RECORDING_EXAMPLES
);

const directory = "benchmark/data/interpolation/lowerGamut";
fs.mkdirSync(directory, { recursive: true });
benchmark.saveResults(directory);
