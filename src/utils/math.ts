/**
 * Math Utilities
 * Simple and memorable math functions
 */

export class MathUtils {
  // Basic arithmetic
  static add(...numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0);
  }

  static sub(a: number, b: number): number {
    return a - b;
  }

  static multiply(...numbers: number[]): number {
    return numbers.reduce((product, num) => product * num, 1);
  }

  static divide(a: number, b: number): number {
    if (b === 0) throw new Error('Division by zero');
    return a / b;
  }

  static pow(base: number, exponent: number): number {
    return Math.pow(base, exponent);
  }

  static sqrt(x: number): number {
    if (x < 0) throw new Error('Cannot calculate square root of negative number');
    return Math.sqrt(x);
  }

  // Advanced operations
  static abs(x: number): number {
    return Math.abs(x);
  }

  static round(x: number, decimals: number = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.round(x * factor) / factor;
  }

  static floor(x: number): number {
    return Math.floor(x);
  }

  static ceil(x: number): number {
    return Math.ceil(x);
  }

  static min(...numbers: number[]): number {
    return Math.min(...numbers);
  }

  static max(...numbers: number[]): number {
    return Math.max(...numbers);
  }

  static random(min: number = 0, max: number = 1): number {
    return Math.random() * (max - min) + min;
  }

  static randomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Trigonometric functions (in degrees by default)
  static sin(degrees: number): number {
    return Math.sin(degrees * Math.PI / 180);
  }

  static cos(degrees: number): number {
    return Math.cos(degrees * Math.PI / 180);
  }

  static tan(degrees: number): number {
    return Math.tan(degrees * Math.PI / 180);
  }

  // Statistics
  static mean(...numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return this.add(...numbers) / numbers.length;
  }

  static median(...numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  }

  static mode(...numbers: number[]): number[] {
    const frequency: Record<number, number> = {};
    let maxFreq = 0;
    
    numbers.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1;
      maxFreq = Math.max(maxFreq, frequency[num]);
    });
    
    return Object.entries(frequency)
      .filter(([_, freq]) => freq === maxFreq)
      .map(([num]) => Number(num));
  }

  static range(...numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return this.max(...numbers) - this.min(...numbers);
  }

  static standardDeviation(...numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = this.mean(...numbers);
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    const variance = this.mean(...squaredDiffs);
    
    return this.sqrt(variance);
  }

  // Geometry
  static circleArea(radius: number): number {
    return Math.PI * this.pow(radius, 2);
  }

  static circleCircumference(radius: number): number {
    return 2 * Math.PI * radius;
  }

  static rectangleArea(width: number, height: number): number {
    return width * height;
  }

  static triangleArea(base: number, height: number): number {
    return 0.5 * base * height;
  }

  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return this.sqrt(this.pow(x2 - x1, 2) + this.pow(y2 - y1, 2));
  }

  // Financial
  static percentage(value: number, percent: number): number {
    return (value * percent) / 100;
  }

  static percentageOf(part: number, whole: number): number {
    if (whole === 0) return 0;
    return (part / whole) * 100;
  }

  static interest(principal: number, rate: number, time: number): number {
    return principal * rate * time / 100;
  }

  static compoundInterest(principal: number, rate: number, time: number, periods: number = 1): number {
    return principal * Math.pow(1 + rate / (100 * periods), periods * time);
  }

  // Conversions
  static degToRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  static radToDeg(radians: number): number {
    return radians * 180 / Math.PI;
  }

  static celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9/5) + 32;
  }

  static fahrenheitToCelsius(fahrenheit: number): number {
    return (fahrenheit - 32) * 5/9;
  }

  // Utilities
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * this.clamp(t, 0, 1);
  }

  static map(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
    const fromRange = fromMax - fromMin;
    const toRange = toMax - toMin;
    
    if (fromRange === 0) return toMin;
    
    const normalized = (value - fromMin) / fromRange;
    return toMin + normalized * toRange;
  }

  static isEven(num: number): boolean {
    return num % 2 === 0;
  }

  static isOdd(num: number): boolean {
    return num % 2 !== 0;
  }

  static isPrime(num: number): boolean {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    
    let i = 5;
    while (i * i <= num) {
      if (num % i === 0 || num % (i + 2) === 0) return false;
      i += 6;
    }
    
    return true;
  }

  static factorial(n: number): number {
    if (n < 0) throw new Error('Factorial not defined for negative numbers');
    if (n === 0 || n === 1) return 1;
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  // Constants
  static get PI(): number {
    return Math.PI;
  }

  static get E(): number {
    return Math.E;
  }

  static get GOLDEN_RATIO(): number {
    return (1 + this.sqrt(5)) / 2;
  }
}

// Short aliases for easy access
export const math = {
  // Basic
  add: MathUtils.add,
  sub: MathUtils.sub,
  multiply: MathUtils.multiply,
  divide: MathUtils.divide,
  pow: MathUtils.pow,
  sqrt: MathUtils.sqrt,
  
  // Advanced
  abs: MathUtils.abs,
  round: MathUtils.round,
  floor: MathUtils.floor,
  ceil: MathUtils.ceil,
  min: MathUtils.min,
  max: MathUtils.max,
  random: MathUtils.random,
  randomInt: MathUtils.randomInt,
  
  // Trig
  sin: MathUtils.sin,
  cos: MathUtils.cos,
  tan: MathUtils.tan,
  
  // Stats
  mean: MathUtils.mean,
  median: MathUtils.median,
  mode: MathUtils.mode,
  range: MathUtils.range,
  standardDeviation: MathUtils.standardDeviation,
  
  // Geometry
  circleArea: MathUtils.circleArea,
  circleCircumference: MathUtils.circleCircumference,
  rectangleArea: MathUtils.rectangleArea,
  triangleArea: MathUtils.triangleArea,
  distance: MathUtils.distance,
  
  // Financial
  percentage: MathUtils.percentage,
  percentageOf: MathUtils.percentageOf,
  interest: MathUtils.interest,
  compoundInterest: MathUtils.compoundInterest,
  
  // Conversions
  degToRad: MathUtils.degToRad,
  radToDeg: MathUtils.radToDeg,
  celsiusToFahrenheit: MathUtils.celsiusToFahrenheit,
  fahrenheitToCelsius: MathUtils.fahrenheitToCelsius,
  
  // Utilities
  clamp: MathUtils.clamp,
  lerp: MathUtils.lerp,
  map: MathUtils.map,
  isEven: MathUtils.isEven,
  isOdd: MathUtils.isOdd,
  isPrime: MathUtils.isPrime,
  factorial: MathUtils.factorial,
  
  // Constants
  PI: MathUtils.PI,
  E: MathUtils.E,
  GOLDEN_RATIO: MathUtils.GOLDEN_RATIO
};