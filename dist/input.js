"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function processAndFilterTemperatures(celsiusValues, threshold) {
    return celsiusValues
        .map(c => (c * 9 / 5) + 32) // Convert Celsius to Fahrenheit
        .filter(fahrenheit => fahrenheit >= threshold); // Filter by threshold
}
//# sourceMappingURL=input.js.map