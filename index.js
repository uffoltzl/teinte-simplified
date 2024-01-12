// @ts-check


/**
 * @param {{ r: number; b: number; g: number; }} color
 */
function srgb_gamma_to_linear(color) {
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
function srgb_linear_to_gamma(color) {
  /**
   * The optical - electrical transfer function (oetf)
   * convert a linear light value to a gamma compressed value
   * @param {number} value
   */
  function oetf(value) {
    let value_sign = value < 0 ? -1 : 1;
    let value_abs = value * value_sign;

    if (value_abs <= 0.0031308) {
      return value * 12.92;
    } else {
      return value_sign * (1.055 * Math.pow(value_abs, 1 / 2.4) - 0.055);
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
function oklab_to_oklch(color) {
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
function oklch_to_oklab(color) {
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
    const hue = constrainAngle(color.h);
    const angle = (hue * Math.PI) / 180;
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
function oklab_to_linear_srgb(color) {
  const lms_g = {
    lg: 1.0 * color.l + 0.3963377773761749 * color.a + 0.2158037573099136 * color.b,
    mg: 1.0 * color.l + -0.1055613458156586 * color.a + -0.0638541728258133 * color.b,
    sg: 1.0 * color.l + -0.0894841775298119 * color.a + -1.2914855480194092 * color.b,
  };
  const lms = {
    l: lms_g.lg ** 3,
    m: lms_g.mg ** 3,
    s: lms_g.sg ** 3,
  };
  return {
    r: 4.0767416360759592 * lms.l + -3.3077115392580625 * lms.m + 0.2309699031821046 * lms.s,
    g: -1.2684379732850315 * lms.l + 2.6097573492876882 * lms.m + -0.3413193760026572 * lms.s,
    b: -0.0041960761386755 * lms.l + -0.7034186179359361 * lms.m + 1.7076146940746113 * lms.s,
  };
}

/**
 * @param {{r:number; g: number; b:number}} linear_color
 */
function linear_srgb_to_oklab(linear_color) {
  const lms_color = {
    l: 0.4122214694707629 * linear_color.r + 0.5363325372617349 * linear_color.g + 0.0514459932675022 * linear_color.b,
    m: 0.2119034958178251 * linear_color.r + 0.6806995506452345 * linear_color.g + 0.1073969535369406 * linear_color.b,
    s: 0.0883024591900564 * linear_color.r + 0.2817188391361215 * linear_color.g + 0.6299787016738222 * linear_color.b,
  };

  const lms_color_g = {
    lg: Math.cbrt(lms_color.l),
    mg: Math.cbrt(lms_color.m),
    sg: Math.cbrt(lms_color.s),
  };

  return {
    l: 0.210454268309314 * lms_color_g.lg + 0.7936177747023054 * lms_color_g.mg + -0.0040720430116193 * lms_color_g.sg,
    a: 1.9779985324311684 * lms_color_g.lg + -2.4285922420485799 * lms_color_g.mg + 0.450593709617411 * lms_color_g.sg,
    b: 0.0259040424655478 * lms_color_g.lg + 0.7827717124575296 * lms_color_g.mg + -0.8086757549230774 * lms_color_g.sg,
  };
}
/**
 * @param {{ r: number; g: number; b: number; }} color
 */
function scale_to_0_1(color) {
    return {
    r: color.r / 255,
    b: color.b / 255,
    g: color.g /255,
  };
}

/**
 * @param {{ r: number; g: number; b: number; }} c1
 * @param {{ r: number; g: number; b: number; }} c2
 * @param {number} t
 */
function interpolateColor(c1, c2, t) {
  const c1_oklab = linear_srgb_to_oklab(srgb_gamma_to_linear(scale_to_0_1(c1)));
  const c2_oklab = linear_srgb_to_oklab(srgb_gamma_to_linear(scale_to_0_1(c2)));

  // Interpolate
  const c_res_oklab = {
    l: c1_oklab.l * (1 - t) + c2_oklab.l * t,
    a: c1_oklab.a * (1 - t) + c2_oklab.a * t,
    b: c1_oklab.b * (1 - t) + c2_oklab.b * t,
  };

  // Apply gamut
  // Step 1: do not apply to RGB
  // Step 2: convert c_res from RGB to Oklch
  const c_res_oklch = oklab_to_oklch(c_res_oklab);

  // Step 3:
  if (c_res_oklch.l >= 1) {
    return { r: 1, g: 1, b: 1 };
  }

  // Step 4:
  if (c_res_oklch.l <= 0) {
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
  const color_linear_srgb = oklab_to_linear_srgb(c_res_oklab)
  if (inGamut(color_linear_srgb)) {
    return color_linear_srgb
  }
  
  // Step 7:
  /**
    * @param {{ l: number; a: number; b: number; }} c1
    * @param {{ l: number; a: number; b: number; }} c2
  */
  function delta(c1, c2) {
    const delta_l = c1.l - c2.l;

    const delta_a = c1.a - c2.a;
    const delta_b = c1.b - c2.b;

    return Math.sqrt(delta_l ** 2 + delta_a ** 2 + delta_b ** 2);
  };

  // Step 8:
  const JUST_NOT_DISCERNABLE = 0.02;
    
  // Step 9:
  const EPSILON = 0.0001;

  // Step 10:
  /**
    * @param {{ r: number; g: number; b: number; }} color
  */
  function clip(color) {
    /**
      * @param {number} value
    */
    function clipValue(value) {
      return Math.min(Math.max(value, 0), 1)
    }
    return {
      r: clipValue(color.r),
      g: clipValue(color.g),
      b: clipValue(color.b)
    }
  };

  // Step 11:
  let min_chroma = 0;

  // Step 12:
  let max_chroma = c_res_oklch.c;
    
  // Step 13:
  let is_min_chroma_inGamut = true;
  let current = c_res_oklch;

  // Step 14:
  while (max_chroma - min_chroma > EPSILON) {
    // Step 14.1:
    let chroma = (min_chroma + max_chroma) / 2;

    // Step 14.2:
    current = c_res_oklch.clone();
    current.c = chroma;

    // Step 14.3
    if (is_min_chroma_inGamut && inGamut(current)) {
      min_chroma = chroma;
      continue;
    }

    // Step 14.4:
    else if (!inGamut(current)) {
      // Step 14.4.1:
      const clipped = clip(current);

      // Step 14.4.2:
      const E = delta(clipped, current);

      // Step 14.4.3:
      if (E < JUST_NOT_DISCERNABLE) {
        // Step 14.4.3.1:
        if (JUST_NOT_DISCERNABLE - E < EPSILON) {
          return clipped;
        }
        // Step 14.4.3.2:
        else {
          // Step 14.4.3.2.1:
          is_min_chroma_inGamut = false;
          // Step 14.4.3.2.2:
          min_chroma = chroma;
        }
      } else {
        // Step 14.4.4:
        max_chroma = chroma;
        continue;
      }
    }
  }

/*    
  
      // Step 10: let clip(color)| be a function which converts color to destination,
      // converts all negative components to zero, converts all components greater that
      // one to one, and returns the result
      const clip = (color: Color) => {
        const destinationColor = color.accept(this.rgbVisitor) as InstanceType<typeof Color.RGB>;
        const clippedColor = destinationColor.clone().clip();
        return clippedColor;
      };
  
  
      // Step 14: while (max - min is greater than epsilon) repeat the following steps
      while (max - min > epsilon) {
        // Step 14.1: set chroma to (min + max) /2
        let chroma = (min + max) / 2;
  
        // Step 14.2: set current to origin_Oklch and then set the chroma component to chroma
        current = origin_Oklch.clone();
        current.c = chroma;
  
        // Step 14.3 if min_inGamut is true and also if inGamut(current) is true,
        // set min to chroma and continue to repeat these steps
        if (min_inGamut && inGamut(current)) {
          min = chroma;
          continue;
        }
  
        // Step 14.4: otherwise, if inGamut(current) is false carry out these steps
        else if (!inGamut(current)) {
          // Step 14.4.1 : set clipped to clip(current)
          const clipped = clip(current);
  
          // Step 14.4.2 : set E to delta(clipped, current)
          const E = delta(clipped, current);
  
          // Step 14.4.3: if E < JND
          if (E < JND) {
            // Step 14.4.3.1: if (JND - E < epsilon) return clipped as the gamut mapped color
            if (JND - E < epsilon) {
              return clipped;
            }
            // Step 14.4.3.2 : otherwise,
            else {
              // console.log('JND - E >= epsilon', color);
              // Step 14.4.3.2.1 : set min_inGamut to false,
              min_inGamut = false;
              // Step 14.4.3.2.2 : set min to chroma
              min = chroma;
            }
          } else {
            // console.log('E >= JND', color);
            // Step 14.4.4: otherwise, set max to chroma and continue to repeat these steps
            max = chroma;
            continue;
          }
        }
      }
  
      // Step 15: return current as the gamut mapped color
      return current.accept(this.rgbVisitor) as InstanceType<typeof Color.RGB>;*/

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
