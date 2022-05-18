var CLIPBOARD = new CLIPBOARD_CLASS("pastebox");
const IDEAL_LAB = xyzToLab(rgbToXyz({ r: 255, g: 145, b: 0 }));
const WHITE_LAB = xyzToLab(rgbToXyz({ r: 255, g: 255, b: 255 }));
const D65 = [95.047, 100, 108.883];
const colorThief = new ColorThief();
var maxParticleCount = 150; //set max confetti count
var particleSpeed = 1; //set the particle animation speed
var startConfetti; //call to start confetti animation
var stopConfetti; //call to stop adding confetti
var toggleConfetti; //call to start or stop the confetti animation depending on whether it's already running
var removeConfetti; //call to stop the confetti animation and remove all confetti immediately

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
      '  <div class="box"></div>' +
      "  <ul>" +
      '    <li class="rgb"></li>' +
      '    <li class="score"></li>' +
      "  </ul>" +
      "</div>";

    var pastedImage = new Image();
    pastedImage.onload = function () {
      // canvas.width = pastedImage.width;
      // canvas.height = pastedImage.height;

      // ctx.clearRect(0, 0, canvas.width, canvas.height);
      // ctx.drawImage(pastedImage, 0, 0);
      var rgbArray = colorThief.getColor(pastedImage);
      var rgb = {};
      rgb.r = rgbArray[0];
      rgb.g = rgbArray[1];
      rgb.b = rgbArray[2];

      var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      var rgbStr = "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";

      var box = element.querySelector(".box");
      box.style.backgroundColor = rgbStr;

      // var distance = Math.sqrt(
      //   Math.pow(rgb.r - r, 2) + Math.pow(rgb.g - g, 2) + Math.pow(rgb.b - b, 2)
      // );
      // var percentage = distance / Math.sqrt(Math.pow(255, 2) * 3);

      const XYZ = rgbToXyz(rgb);
      const LAB = xyzToLab(XYZ);
      var deltaE = getDeltaE(IDEAL_LAB, LAB);

      element.querySelector(".rgb").textContent = rgbStr;
      element.querySelector(".score").textContent =
        "Score: " + Math.round(deltaE);
      element.style.backgroundColor =
        deltaE < 100
          ? getColor(deltaE / 100)
          : ["hsl(", ((1 - 100) * 120).toString(10), ",50%,75%)"].join("");

      if (deltaE <= 40) {
        startConfetti();
        setInterval(stopConfetti, 750);
      }
      // element.classList.add(Math.round((1 - percentage) * 100));
    };
    pastedImage.src = source;
    var img = element.querySelector("img");
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

(function () {
  startConfetti = startConfettiInner;
  stopConfetti = stopConfettiInner;
  toggleConfetti = toggleConfettiInner;
  removeConfetti = removeConfettiInner;
  var colors = [
    "DodgerBlue",
    "OliveDrab",
    "Gold",
    "Pink",
    "SlateBlue",
    "LightBlue",
    "Violet",
    "PaleGreen",
    "SteelBlue",
    "SandyBrown",
    "Chocolate",
    "Crimson",
  ];
  var streamingConfetti = false;
  var animationTimer = null;
  var particles = [];
  var waveAngle = 0;

  function resetParticle(particle, width, height) {
    particle.color = colors[(Math.random() * colors.length) | 0];
    particle.x = Math.random() * width;
    particle.y = Math.random() * height - height;
    particle.diameter = Math.random() * 10 + 5;
    particle.tilt = Math.random() * 10 - 10;
    particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
    particle.tiltAngle = 0;
    return particle;
  }

  function startConfettiInner() {
    var width = window.innerWidth - 80;
    var height = window.innerHeight - 60;
    window.requestAnimFrame = (function () {
      return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
          return window.setTimeout(callback, 16.6666667);
        }
      );
    })();
    var canvas = document.getElementById("confetti-canvas");
    if (canvas === null) {
      canvas = document.createElement("canvas");
      canvas.setAttribute("id", "confetti-canvas");
      canvas.setAttribute(
        "style",
        "display:block;z-index:999999;pointer-events:none"
      );
      document.body.appendChild(canvas);
      canvas.width = width;
      canvas.height = height;
      window.addEventListener(
        "resize",
        function () {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        },
        true
      );
    }
    var context = canvas.getContext("2d");
    while (particles.length < maxParticleCount)
      particles.push(resetParticle({}, width, height));
    streamingConfetti = true;
    if (animationTimer === null) {
      (function runAnimation() {
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if (particles.length === 0) animationTimer = null;
        else {
          updateParticles();
          drawParticles(context);
          animationTimer = requestAnimFrame(runAnimation);
        }
      })();
    }
  }

  function stopConfettiInner() {
    streamingConfetti = false;
  }

  function removeConfettiInner() {
    stopConfetti();
    particles = [];
  }

  function toggleConfettiInner() {
    if (streamingConfetti) stopConfettiInner();
    else startConfettiInner();
  }

  function drawParticles(context) {
    var particle;
    var x;
    for (var i = 0; i < particles.length; i++) {
      particle = particles[i];
      context.beginPath();
      context.lineWidth = particle.diameter;
      context.strokeStyle = particle.color;
      x = particle.x + particle.tilt;
      context.moveTo(x + particle.diameter / 2, particle.y);
      context.lineTo(x, particle.y + particle.tilt + particle.diameter / 2);
      context.stroke();
    }
  }

  function updateParticles() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    var particle;
    waveAngle += 0.01;
    for (var i = 0; i < particles.length; i++) {
      particle = particles[i];
      if (!streamingConfetti && particle.y < -15) particle.y = height + 100;
      else {
        particle.tiltAngle += particle.tiltAngleIncrement;
        particle.x += Math.sin(waveAngle);
        particle.y +=
          (Math.cos(waveAngle) + particle.diameter + particleSpeed) * 0.5;
        particle.tilt = Math.sin(particle.tiltAngle) * 15;
      }
      if (particle.x > width + 20 || particle.x < -20 || particle.y > height) {
        if (streamingConfetti && particles.length <= maxParticleCount)
          resetParticle(particle, width, height);
        else {
          particles.splice(i, 1);
          i--;
        }
      }
    }
  }
})();
