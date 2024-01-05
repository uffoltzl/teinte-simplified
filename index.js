// @ts-check

/**
 * @param {number} value
 */
function srgb_to_linear(value) {
  if (Math.abs(value) <= 0.04045) {
    return value / 12.92;
  } else {
    return Math.sign(value) * Math.pow((Math.abs(value) + 0.055) / 1.055, 2.4);
  }
}

/**
 * @param {number} value
 */
function linear_to_srgb(value) {
  let value_sign = value < 0 ? -1 : 1;
  let value_abs = value * value_sign;

  if (value_abs <= 0.0031308) {
    return value * 12.92;
  } else {
    return value_sign * (1.055 * Math.pow(value_abs, 1 / 2.4) - 0.055);
  }
}

/**
 * @param {{l:number; a: number; b:number}} oklabColor
 */
function oklab_to_oklch(oklabColor) {
  /**
   * @param {number} angle
   */
  function constrainAngle(angle) {
    return ((angle % 360) + 360) % 360;
  }
  const { l, a, b } = oklabColor;
  let epsilon = 0.0002;
  if (Math.abs(a) < epsilon && Math.abs(b) < epsilon) {
    return {
      l,
      c: 0,
      h: NaN,
    };
  } else {
    return {
      l,
      c: Math.sqrt(a * a + b * b),
      h: constrainAngle((Math.atan2(b, a) * 180) / Math.PI),
    };
  }
}

/**
 * @param {{l:number; c: number; h:number}} oklch_color
 */
function oklch_to_rgb(oklch_color) {
  let oklabColor;

  if (isNaN(oklch_color.h)) {
    oklabColor = {
      l: oklch_color.l,
      a: 0,
      b: 0,
    };
  } else {
    const angle = (oklch_color.h * Math.PI) / 180;
    oklabColor = {
      l: oklch_color.l,
      a: Math.cos(angle) * oklch_color.c,
      b: Math.sin(angle) * oklch_color.c,
    };
  }

  // Convert OkLab to RGB
  const c_res_lms_g = {
    lg: 1.0 * oklabColor.l + 0.3963377773761749 * oklabColor.a + 0.2158037573099136 * oklabColor.b,
    mg: 1.0 * oklabColor.l + -0.1055613458156586 * oklabColor.a + -0.0638541728258133 * oklabColor.b,
    sg: 1.0 * oklabColor.l + -0.0894841775298119 * oklabColor.a + -1.2914855480194092 * oklabColor.b,
  };
  const c_res_lms = {
    l: c_res_lms_g.lg ** 3,
    m: c_res_lms_g.mg ** 3,
    s: c_res_lms_g.sg ** 3,
  };
  const c_res_lin_rgb = {
    r: 4.0767416360759592 * c_res_lms.l + -3.3077115392580625 * c_res_lms.m + 0.2309699031821046 * c_res_lms.s,
    g: -1.2684379732850315 * c_res_lms.l + 2.6097573492876882 * c_res_lms.m + -0.3413193760026572 * c_res_lms.s,
    b: -0.0041960761386755 * c_res_lms.l + -0.7034186179359361 * c_res_lms.m + 1.7076146940746113 * c_res_lms.s,
  };
  const c_res_rgb = {
    r: linear_to_srgb(c_res_lin_rgb.r),
    g: linear_to_srgb(c_res_lin_rgb.g),
    b: linear_to_srgb(c_res_lin_rgb.b),
  };

  return c_res_rgb;
}

/**
 * @param {{l:number; c: number; h:number}} oklchColor
 */
function inGamut(oklchColor) {
  const rgbColor = oklch_to_rgb(oklchColor);
  const { r, g, b } = rgbColor;
  return [r, g, b].every((c) => c >= 0 && c <= 1);
}

/**
 * @param {{ r: number; g: number; b: number; }} c1
 * @param {{ r: number; g: number; b: number; }} c2
 * @param {number} t
 */
function interpolateColor(c1, c2, t) {
  // Convert color values from [0, 255] to [0, 1]
  const c1_srgb = { r: c1.r / 255, g: c1.g / 255, b: c1.b / 255 };
  const c2_srgb = { r: c2.r / 255, g: c2.g / 255, b: c2.b / 255 };

  // Convert c1 RGB to OkLab
  const c1_lin_srgb = {
    r: srgb_to_linear(c1_srgb.r),
    b: srgb_to_linear(c1_srgb.b),
    g: srgb_to_linear(c1_srgb.g),
  };

  const c1_lms = {
    l: 0.4122214694707629 * c1_lin_srgb.r + 0.5363325372617349 * c1_lin_srgb.g + 0.0514459932675022 * c1_lin_srgb.b,
    m: 0.2119034958178251 * c1_lin_srgb.r + 0.6806995506452345 * c1_lin_srgb.g + 0.1073969535369406 * c1_lin_srgb.b,
    s: 0.0883024591900564 * c1_lin_srgb.r + 0.2817188391361215 * c1_lin_srgb.g + 0.6299787016738222 * c1_lin_srgb.b,
  };

  const c1_lms_g = {
    lg: Math.cbrt(c1_lms.l),
    mg: Math.cbrt(c1_lms.m),
    sg: Math.cbrt(c1_lms.s),
  };

  const c1_OkLab = {
    l: 0.210454268309314 * c1_lms_g.lg + 0.7936177747023054 * c1_lms_g.mg + -0.0040720430116193 * c1_lms_g.sg,
    a: 1.9779985324311684 * c1_lms_g.lg + -2.4285922420485799 * c1_lms_g.mg + 0.450593709617411 * c1_lms_g.sg,
    b: 0.0259040424655478 * c1_lms_g.lg + 0.7827717124575296 * c1_lms_g.mg + -0.8086757549230774 * c1_lms_g.sg,
  };

  // Convert c2 RGB to OkLab
  const c2_lin_srgb = {
    r: srgb_to_linear(c2_srgb.r),
    b: srgb_to_linear(c2_srgb.b),
    g: srgb_to_linear(c2_srgb.g),
  };

  const c2_lms = {
    l: 0.4122214694707629 * c2_lin_srgb.r + 0.5363325372617349 * c2_lin_srgb.g + 0.0514459932675022 * c2_lin_srgb.b,
    m: 0.2119034958178251 * c2_lin_srgb.r + 0.6806995506452345 * c2_lin_srgb.g + 0.1073969535369406 * c2_lin_srgb.b,
    s: 0.0883024591900564 * c2_lin_srgb.r + 0.2817188391361215 * c2_lin_srgb.g + 0.6299787016738222 * c2_lin_srgb.b,
  };

  const c2_lms_g = {
    lg: Math.cbrt(c2_lms.l),
    mg: Math.cbrt(c2_lms.m),
    sg: Math.cbrt(c2_lms.s),
  };

  const c2_OkLab = {
    l: 0.210454268309314 * c2_lms_g.lg + 0.7936177747023054 * c2_lms_g.mg + -0.0040720430116193 * c2_lms_g.sg,
    a: 1.9779985324311684 * c2_lms_g.lg + -2.4285922420485799 * c2_lms_g.mg + 0.450593709617411 * c2_lms_g.sg,
    b: 0.0259040424655478 * c2_lms_g.lg + 0.7827717124575296 * c2_lms_g.mg + -0.8086757549230774 * c2_lms_g.sg,
  };

  // Interpolate
  const c_res = {
    l: c1_OkLab.l * (1 - t) + c2_OkLab.l * t,
    a: c1_OkLab.a * (1 - t) + c2_OkLab.a * t,
    b: c1_OkLab.b * (1 - t) + c2_OkLab.b * t,
  };

  // Apply gamut
  // Step 1 : do not apply to RGB
  // Step 2 : convert c_res from RGB to Oklch
  const c_res_oklch = oklab_to_oklch(c_res);

  // Step 3 :
  if (c_res_oklch.l >= 1) {
    return { r: 1, g: 1, b: 1 };
  }

  // Step 4 :
  if (c_res_oklch.l <= 0) {
    return { r: 0, g: 0, b: 0 };
  }

  // Step 6 :
  if (inGamut(c_res_oklch)) {
    return oklch_to_rgb(c_res_oklch);
  }

  // Convert OkLab to RGB
  /*const c_res_lms_g = {
    lg: 1.0 * c_res.l + 0.3963377773761749 * c_res.a + 0.2158037573099136 * c_res.b,
    mg: 1.0 * c_res.l + -0.1055613458156586 * c_res.a + -0.0638541728258133 * c_res.b,
    sg: 1.0 * c_res.l + -0.0894841775298119 * c_res.a + -1.2914855480194092 * c_res.b,
  };
  const c_res_lms = {
    l: c_res_lms_g.lg ** 3,
    m: c_res_lms_g.mg ** 3,
    s: c_res_lms_g.sg ** 3,
  };
  const c_res_lin_rgb = {
    r: 4.0767416360759592 * c_res_lms.l + -3.3077115392580625 * c_res_lms.m + 0.2309699031821046 * c_res_lms.s,
    g: -1.2684379732850315 * c_res_lms.l + 2.6097573492876882 * c_res_lms.m + -0.3413193760026572 * c_res_lms.s,
    b: -0.0041960761386755 * c_res_lms.l + -0.7034186179359361 * c_res_lms.m + 1.7076146940746113 * c_res_lms.s,
  };
  const c_res_rgb = {
    r: linear_to_srgb(c_res_lin_rgb.r),
    g: linear_to_srgb(c_res_lin_rgb.g),
    b: linear_to_srgb(c_res_lin_rgb.b),
  };*/

  // const mappedColor = {
  //   r: Math.min(Math.max(c_res_rgb.r, 0), 1),
  //   g: Math.min(Math.max(c_res_rgb.g, 0), 1),
  //   b: Math.min(Math.max(c_res_rgb.b, 0), 1),
  // };

  // Convert color values from [0, 1] to [0, 255]
  return {
    r: Math.round(mappedColor.r * 255),
    g: Math.round(mappedColor.g * 255),
    b: Math.round(mappedColor.b * 255),
  };
}

console.log(interpolateColor({ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, 0.5));
