/**
 * An algorithm for determining how orange an image is.
 *
 * It takes the three most orange colors from the color palette, scores them and averages the score, compares it with the score
 * of the dominant color and returns the best one.
 *
 * Credit to:
 *  https://github.com/lokesh/color-thief
 *  https://github.com/matkl/average-color
 *  https://github.com/loonywizard/js-confetti
 *  Whoever made the RGB -> LAB converter
 */

var CLIPBOARD = new CLIPBOARD_CLASS("pastebox");
const IDEAL_LAB = xyzToLab(rgbToXyz({ r: 250, g: 151, b: 57 }));
const WHITE_LAB = xyzToLab(rgbToXyz({ r: 255, g: 255, b: 255 }));
const D65 = [95.047, 100, 108.883];
const colorThief = new ColorThief();
const jsConfetti = new JSConfetti();

/**
 * image pasting into canvas
 *
 * @param {string} canvas_id - canvas id
 * @param {boolean} autoresize - if canvas will be resized
 */
function CLIPBOARD_CLASS(canvas_id) {
  var _self = this;
  var canvas = document.getElementById(canvas_id);
  var ctx = document.getElementById(canvas_id).getContext("2d");

  //handlers
  document.addEventListener(
    "paste",
    function (e) {
      _self.paste_auto(e);
    },
    false
  );

  //on paste
  this.paste_auto = function (e) {
    if (e.clipboardData) {
      var items = e.clipboardData.items;
      if (!items) return;

      //access data directly
      var is_image = false;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          //image
          var blob = items[i].getAsFile();
          var URLObj = window.URL || window.webkitURL;
          var source = URLObj.createObjectURL(blob);
          drawImage(source);
          is_image = true;
        }
      }
      if (is_image == true) {
        e.preventDefault();
      }
    }
  };

  //draw pasted image to canvas
  const drawImage = function (source) {
    var element = document.createElement("div");
    element.className = "row";
    element.innerHTML =
      '<div class="cell image">' +
      "  <img />" +
      "</div>" +
      '<div class="cell color">' +
      '  <div class="color-box">' +
      '    <div class="box"></div>' +
      '    <div class="box"></div>' +
      '    <div class="box"></div>' +
      "  </div>" +
      "  <ul>" +
      '    <li class="rgb"></li>' +
      '    <li class="score"></li>' +
      "  </ul>" +
      "</div>";

    var pastedImage = new Image();
    pastedImage.onload = function () {
      var rgbAverage = { r: 0, g: 0, b: 0 };
      var rgbStr;
      var score = 0;
      var topColorPalette = colorThief.getPalette(pastedImage, 20);
      var dominantColor = colorThief.getColor(pastedImage, 3);
      console.log(dominantColor);

      var scoreList = [];
      for (var i = 0; i < topColorPalette.length; i++) {
        var color = topColorPalette[i];
        var score = getDeltaE(
          IDEAL_LAB,
          xyzToLab(rgbToXyz({ r: color[0], g: color[1], b: color[2] }))
        );
        scoreList.push({ index: i, score: score });
      }

      topColorPalette.sort((a, b) => {
        return scoreList[a] > scoreList[b]
          ? -1
          : scoreList[a] == scoreList[b]
          ? 0
          : 1;
      });

      var topThreePalette = [];
      topThreePalette.push(topColorPalette[0]);
      topThreePalette.push(topColorPalette[1]);
      topThreePalette.push(topColorPalette[2]);

      var i = 1;
      for (var color of topThreePalette) {
        rgbAverage.r += color[0];
        rgbAverage.g += color[1];
        rgbAverage.b += color[2];
        rgbStr = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";

        var box = element.children[1].children[0].children[i++ - 1];
        box.style.backgroundColor = rgbStr;

        const XYZ = rgbToXyz({ r: color[0], g: color[1], b: color[2] });
        const LAB = xyzToLab(XYZ);
        var singleScore = getDeltaE(IDEAL_LAB, LAB);
        if (singleScore < 40) singleScore /= 2;
        score += singleScore;
      }

      rgbAverage.r /= topThreePalette.length;
      rgbAverage.g /= topThreePalette.length;
      rgbAverage.b /= topThreePalette.length;
      rgbStr =
        "rgb(" +
        Math.round(rgbAverage.r) +
        ", " +
        Math.round(rgbAverage.g) +
        ", " +
        Math.round(rgbAverage.b) +
        ")";
      score /= topThreePalette.length;

      const XYZ = rgbToXyz({
        r: dominantColor[0],
        g: dominantColor[1],
        b: dominantColor[2],
      });
      const LAB = xyzToLab(XYZ);
      var dominantScore = getDeltaE(IDEAL_LAB, LAB);
      if (dominantScore < 40) dominantScore /= 2;
      if (score > dominantScore + 10) score = dominantScore * 1.3;

      // var distance = Math.sqrt(
      //   Math.pow(rgb.r - r, 2) + Math.pow(rgb.g - g, 2) + Math.pow(rgb.b - b, 2)
      // );
      // var percentage = distance / Math.sqrt(Math.pow(255, 2) * 3);

      // const XYZ = rgbToXyz(rgbAverage);
      // const LAB = xyzToLab(XYZ);
      // var deltaE = getDeltaE(IDEAL_LAB, LAB);

      element.querySelector(".rgb").textContent = rgbStr;
      element.querySelector(".score").textContent =
        "Score: " + Math.round(score);
      element.style.backgroundColor =
        score < 100
          ? getColor(score / 100)
          : ["hsl(", ((1 - 100) * 120).toString(10), ",50%,75%)"].join("");

      if (score <= 40) {
        jsConfetti.addConfetti({
          emojis: ["🍊", "🧡", "📙", "🦋"],
          emojiSize: 30,
          confettiNumber: 20,
        });
        jsConfetti.addConfetti();
        // startConfetti();
        // setInterval(stopConfetti, 750);
      }
      // element.classList.add(Math.round((1 - percentage) * 100));
    };
    pastedImage.src = source;
    var img = element.children[0].children[0];
    img.src = source;
    document.getElementById("image-wrapper").prepend(element);
  };
}

// Get the average color of an image
function getAverageColor(img) {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  var width = (canvas.width = img.naturalWidth);
  var height = (canvas.height = img.naturalHeight);

  ctx.drawImage(img, 0, 0);

  var imageData = ctx.getImageData(0, 0, width, height);
  var data = imageData.data;
  var r = 0;
  var g = 0;
  var b = 0;

  // Loop through all pixels
  for (var i = 0, l = data.length; i < l; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  // Get average pixel color
  r = Math.floor(r / (data.length / 4));
  g = Math.floor(g / (data.length / 4));
  b = Math.floor(b / (data.length / 4));

  // Return colors
  return { r: r, g: g, b: b };
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h, s: s, l: l };
}

function getColor(value) {
  //value from 0 to 1
  var hue = ((1 - value) * 120).toString(10);
  return ["hsl(", hue, ",50%,75%)"].join("");
}

/**
 * Converts RGB color to CIE 1931 XYZ color space.
 * https://www.image-engineering.de/library/technotes/958-how-to-convert-between-srgb-and-ciexyz
 * @param  {string} rgb
 * @return {number[]}
 */
function rgbToXyz(rgb) {
  // const [r, g, b] = hexToRgb(hex).map(_ => _ / 255).map(sRGBtoLinearRGB)
  const X = 0.4124 * rgb.r + 0.3576 * rgb.g + 0.1805 * rgb.b;
  const Y = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  const Z = 0.0193 * rgb.r + 0.1192 * rgb.g + 0.9505 * rgb.b;
  // For some reason, X, Y and Z are multiplied by 100.
  return [X, Y, Z].map((_) => _ * 100);
}

/**
 * Undoes gamma-correction from an RGB-encoded color.
 * https://en.wikipedia.org/wiki/SRGB#Specification_of_the_transformation
 * https://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color
 * @param  {number}
 * @return {number}
 */
function sRGBtoLinearRGB(color) {
  // Send this function a decimal sRGB gamma encoded color value
  // between 0.0 and 1.0, and it returns a linearized value.
  if (color <= 0.04045) {
    return color / 12.92;
  } else {
    return Math.pow((color + 0.055) / 1.055, 2.4);
  }
}

/**
 * Converts hex color to RGB.
 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 * @param  {string} hex
 * @return {number[]} [rgb]
 */
function hexToRgb(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (match) {
    match.shift();
    return match.map((_) => parseInt(_, 16));
  }
}

/**
 * Converts CIE 1931 XYZ colors to CIE L*a*b*.
 * The conversion formula comes from <http://www.easyrgb.com/en/math.php>.
 * https://github.com/cangoektas/xyz-to-lab/blob/master/src/index.js
 * @param   {number[]} color The CIE 1931 XYZ color to convert which refers to
 *                           the D65/2° standard illuminant.
 * @returns {number[]}       The color in the CIE L*a*b* color space.
 */
// X, Y, Z of a "D65" light source.
// "D65" is a standard 6500K Daylight light source.
// https://en.wikipedia.org/wiki/Illuminant_D65
function xyzToLab([x, y, z]) {
  const D65 = [95.047, 100, 108.883];

  [x, y, z] = [x, y, z].map((v, i) => {
    v = v / D65[i];
    return v > 0.008856 ? Math.pow(v, 1 / 3) : v * 7.787 + 16 / 116;
  });
  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);
  return { L: l, A: a, B: b };
}

/**
 * Returns the dE94 value.
 * @method
 * @returns {number}
 */
const getDeltaE = function (x1, x2) {
  var sqrt = Math.sqrt;
  var pow = Math.pow;

  return sqrt(
    pow(calculateL(x1, x2), 2) +
      pow(calculateA(x1, x2), 2) +
      pow(calculateB(x1, x2), 2)
  );
};

/**
 * Calculates the lightness value.
 * @method
 * @returns {number}
 */
const calculateL = function (x1, x2) {
  return (x1.L - x2.L) / 1;
};

/**
 * Calculates the chroma value.
 * @method
 * @returns {number}
 */
const calculateA = function (x1, x2) {
  var sqrt = Math.sqrt;
  var pow = Math.pow;

  //top
  var c1 = sqrt(pow(x1.A, 2) + pow(x1.B, 2));
  var c2 = sqrt(pow(x2.A, 2) + pow(x2.B, 2));
  var cab = c1 - c2;

  // bottom
  var sc = 1 + 0.045 * c1;

  return cab / (1 * sc);
};

/**
 * Calculates the hue value.
 * @method
 * @returns {number}
 */
const calculateB = function (x1, x2) {
  var sqrt = Math.sqrt;
  var pow = Math.pow;

  // cab
  var c1 = sqrt(pow(x1.A, 2) + pow(x1.B, 2));
  var c2 = sqrt(pow(x2.A, 2) + pow(x2.B, 2));
  var cab = c1 - c2;

  // top
  var a = x1.A - x2.A;
  var b = x1.B - x2.B;
  var hab = sqrt(pow(a, 2) + pow(b, 2) - pow(cab, 2)) || 0;

  // bottom
  var c1 = sqrt(pow(x1.A, 2) + pow(x1.B, 2));
  var sh = 1 + 0.015 * c1;

  return hab / sh;
};
