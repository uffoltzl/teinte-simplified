// @ts-check

const { benchmark } = require("./benchmark/benchmark");

/**
 * @param {{ r: number; b: number; g: number; }} color
 */
function srgbGammaToLinear(color) {
  /**
   * The electrical - optical transfer function (eotf)
   * convert a gamma compressed value to a linear light value
   * @param {number} value
   */
  function eotf(value) {
    if (Math.abs(value) <= 0.04045) {
      return value / 12.92;
    } else {
      return Math.sign(value) * Math.pow((Math.abs(value) + 0.055) / 1.055, 2.4);
    }
  }

  return {
    r: eotf(color.r),
    b: eotf(color.b),
    g: eotf(color.g),
  };
}

/**
 * @param {{ r: any; g: any; b: any; }} color
 */
function srgbLinearToGamma(color) {
  /**
   * The optical - electrical transfer function (oetf)
   * convert a linear light value to a gamma compressed value
   * @param {number} value
   */
  function oetf(value) {
    let valueSign = value < 0 ? -1 : 1;
    let valueAbs = value * valueSign;

    if (valueAbs <= 0.0031308) {
      return value * 12.92;
    } else {
      return valueSign * (1.055 * Math.pow(valueAbs, 1 / 2.4) - 0.055);
    }
  }
  return {
    r: oetf(color.r),
    b: oetf(color.b),
    g: oetf(color.g),
  };
}

/**
 * @param {{l:number; a: number; b:number}} color
 */
function oklabToOklch(color) {
  /**
   * @param {number} angle
   */
  function constrainAngle(angle) {
    return ((angle % 360) + 360) % 360;
  }
  let epsilon = 0.0002;
  if (Math.abs(color.a) < epsilon && Math.abs(color.b) < epsilon) {
    return {
      l: color.l,
      c: 0,
      h: NaN,
    };
  } else {
    return {
      l: color.l,
      c: Math.sqrt(color.a ** 2 + color.b ** 2),
      h: constrainAngle((Math.atan2(color.b, color.a) * 180) / Math.PI),
    };
  }
}

/**
 *
 * @param {{l:number; c: number; h:number}} color
 */
function oklchToOklab(color) {
  /**
   * @param {number} angle
   */
  function constrainAngle(angle) {
    return ((angle % 360) + 360) % 360;
  }
  if (isNaN(color.h)) {
    return {
      l: color.l,
      a: 0,
      b: 0,
    };
  } else {
    let hue = constrainAngle(color.h);
    let angle = (hue * Math.PI) / 180;
    return {
      l: color.l,
      a: Math.cos(angle) * color.c,
      b: Math.sin(angle) * color.c,
    };
  }
}

/**
 * @param {{l:number; a: number; b:number}} color
 */
function oklabToLinearSrgb(color) {
  let lmsG = {
    lg: 1.0 * color.l + 0.3963377773761749 * color.a + 0.2158037573099136 * color.b,
    mg: 1.0 * color.l + -0.1055613458156586 * color.a + -0.0638541728258133 * color.b,
    sg: 1.0 * color.l + -0.0894841775298119 * color.a + -1.2914855480194092 * color.b,
  };
  let lms = {
    l: lmsG.lg ** 3,
    m: lmsG.mg ** 3,
    s: lmsG.sg ** 3,
  };
  return {
    r: 4.0767416360759592 * lms.l + -3.3077115392580625 * lms.m + 0.2309699031821046 * lms.s,
    g: -1.2684379732850315 * lms.l + 2.6097573492876882 * lms.m + -0.3413193760026572 * lms.s,
    b: -0.0041960761386755 * lms.l + -0.7034186179359361 * lms.m + 1.7076146940746113 * lms.s,
  };
}

/**
 * @param {{r:number; g: number; b:number}} color
 */
function linearSrgbToOklab(color) {
  let lms = {
    l: 0.4122214694707629 * color.r + 0.5363325372617349 * color.g + 0.0514459932675022 * color.b,
    m: 0.2119034958178251 * color.r + 0.6806995506452345 * color.g + 0.1073969535369406 * color.b,
    s: 0.0883024591900564 * color.r + 0.2817188391361215 * color.g + 0.6299787016738222 * color.b,
  };

  let lmsG = {
    lg: Math.cbrt(lms.l),
    mg: Math.cbrt(lms.m),
    sg: Math.cbrt(lms.s),
  };

  return {
    l: 0.210454268309314 * lmsG.lg + 0.7936177747023054 * lmsG.mg + -0.0040720430116193 * lmsG.sg,
    a: 1.9779985324311684 * lmsG.lg + -2.4285922420485799 * lmsG.mg + 0.450593709617411 * lmsG.sg,
    b: 0.0259040424655478 * lmsG.lg + 0.7827717124575296 * lmsG.mg + -0.8086757549230774 * lmsG.sg,
  };
}
/**
 * @param {{ r: number; g: number; b: number; }} color
 */
function scaleTo01(color) {
  return {
    r: color.r / 255,
    b: color.b / 255,
    g: color.g / 255,
  };
}

/**
 * @param {{ r: number; g: number; b: number; }} color
 */
function scaleTo255(color) {
  return {
    r: Math.round(color.r * 255),
    b: Math.round(color.b * 255),
    g: Math.round(color.g * 255),
  };
}

/**
 * @param {{ r: number; g: number; b: number; }} c1
 * @param {{ r: number; g: number; b: number; }} c2
 * @param {number} t
 */
function interpolateColor(c1, c2, t) {
  benchmark.recordMark("Begin");

  benchmark.recordMark("c1 rgb to oklab begin");
  let c1Lab = linearSrgbToOklab(srgbGammaToLinear(scaleTo01(c1)));
  benchmark.recordMark("c1 rgb to oklab end");

  benchmark.recordMark("c2 rgb to oklab begin");
  let c2Lab = linearSrgbToOklab(srgbGammaToLinear(scaleTo01(c2)));
  benchmark.recordMark("c2 rgb to oklab end");

  // Interpolate
  benchmark.recordMark("Interpolation begin");
  let cLab = {
    l: c1Lab.l * (1 - t) + c2Lab.l * t,
    a: c1Lab.a * (1 - t) + c2Lab.a * t,
    b: c1Lab.b * (1 - t) + c2Lab.b * t,
  };
  benchmark.recordMark("Interpolation end");

  // CSS 4 Gamut algorithm
  benchmark.recordMark("Gamut mapping before loop begin");

  // Step 2: convert c_res from RGB to Oklch
  let cLch = oklabToOklch(cLab);

  // Step 3:
  if (cLch.l >= 1) {
    return { r: 255, g: 255, b: 255 };
  }

  // Step 4:
  if (cLch.l <= 0) {
    return { r: 0, g: 0, b: 0 };
  }

  // Step 5:
  /**
   * @param {{r: number; b: number; g: number}} color
   */
  function inGamut(color) {
    return [color.r, color.g, color.b].every((value) => value >= 0 && value <= 1);
  }

  // Step 6:
  let cLinearRGB = oklabToLinearSrgb(cLab);
  if (inGamut(cLinearRGB)) {
    return scaleTo255(srgbLinearToGamma(cLinearRGB));
  }

  // Step 7:
  /**
   * @param {{ l: number; a: number; b: number; }} c1
   * @param {{ l: number; a: number; b: number; }} c2
   */
  function delta(c1, c2) {
    let dl = c1.l - c2.l;
    let da = c1.a - c2.a;
    let db = c1.b - c2.b;
    return Math.sqrt(dl ** 2 + da ** 2 + db ** 2);
  }

  // Step 8:
  let JUST_NOT_DISCERNABLE = 0.02;

  // Step 9:
  let EPSILON = 0.0001;

  // Step 10:
  /**
   * @param {{ r: number; g: number; b: number; }} color
   */
  function clip(color) {
    /**
     * @param {number} value
     */
    function clipValue(value) {
      return Math.min(Math.max(value, 0), 1);
    }
    return {
      r: clipValue(color.r),
      g: clipValue(color.g),
      b: clipValue(color.b),
    };
  }

  // Step 11:
  let minChroma = 0;

  // Step 12:
  let maxChroma = cLch.c;

  // Step 13:
  let isMinChromaInGamut = true;
  let chroma = (minChroma + maxChroma) / 2;

  // New step inspired by color-js/color.js
  let clippedLinearRGB = clip(cLinearRGB);
  let clippedOklab = linearSrgbToOklab(clippedLinearRGB);
  let E = delta(clippedOklab, cLab);
  if (E < JUST_NOT_DISCERNABLE) {
    return scaleTo255(srgbLinearToGamma(clippedLinearRGB));
  }

  benchmark.recordMark("Gamut mapping before loop end");

  benchmark.recordMark("Gamut mapping loop begin");
  // Step 14:
  while (maxChroma - minChroma > EPSILON) {
    // Step 14.1:
    chroma = (minChroma + maxChroma) / 2;

    // Step 14.2:
    let currentLch = { ...cLch, c: chroma };
    let currentLab = oklchToOklab(currentLch);
    let currentLinearRGB = oklabToLinearSrgb(currentLab);

    // Step 14.3
    let isCurrentInRGBGamut = inGamut(currentLinearRGB);
    if (isMinChromaInGamut && isCurrentInRGBGamut) {
      minChroma = chroma;
    }
    // Step 14.4:
    else {
      // Step 14.4.1:
      currentLinearRGB = clip(currentLinearRGB);
      clippedOklab = linearSrgbToOklab(currentLinearRGB);

      // Step 14.4.2:
      let E = delta(clippedOklab, currentLab);

      // Step 14.4.3:
      if (E < JUST_NOT_DISCERNABLE) {
        // Step 14.4.3.1:
        if (JUST_NOT_DISCERNABLE - E < EPSILON) {
          break;
        }
        // Step 14.4.3.2:
        else {
          // Step 14.4.3.2.1:
          isMinChromaInGamut = false;
          // Step 14.4.3.2.2:
          minChroma = chroma;
        }
      } else {
        // Step 14.4.4:
        maxChroma = chroma;
        continue;
      }
    }
  }
  benchmark.recordMark("Gamut mapping loop end");

  benchmark.recordMark("Gamut mapping after loop begin");
  const result = scaleTo255(srgbLinearToGamma(clippedLinearRGB));
  benchmark.recordMark("Gamut mapping after loop end");

  benchmark.recordMark("End");
  return result;
}

module.exports = {
  interpolateColor,
};
