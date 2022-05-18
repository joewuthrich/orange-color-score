var CLIPBOARD = new CLIPBOARD_CLASS("pastebox", true);

var r = 255;
var g = 145;
var b = 0;

/**
 * image pasting into canvas
 *
 * @param {string} canvas_id - canvas id
 * @param {boolean} autoresize - if canvas will be resized
 */
function CLIPBOARD_CLASS(canvas_id, autoresize) {
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
  drawImage = function (source) {
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
      canvas.width = pastedImage.width;
      canvas.height = pastedImage.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(pastedImage, 0, 0);
      var rgb = getAverageColor(pastedImage);
      var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      var rgbStr = "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";

      var box = element.querySelector(".box");
      box.style.backgroundColor = rgbStr;

      var distance = Math.sqrt(
        Math.pow(rgb.r - r, 2) + Math.pow(rgb.g - g, 2) + Math.pow(rgb.b - b, 2)
      );

      var percentage = distance / Math.sqrt(Math.pow(255, 2) * 3);

      element.querySelector(".rgb").textContent = rgbStr;
      element.querySelector(".score").textContent =
        Math.round((1 - percentage) * 100) + "%";
    };
    pastedImage.src = source;
    var img = element.querySelector("img");
    img.src = source;
    document.getElementById("image-wrapper").prepend(element);
  };
}

// function addImage(file) {
//   var element = document.createElement("div");
//   element.className = "row";
//   element.innerHTML =
//     '<div class="cell image">' +
//     "  <img />" +
//     "</div>" +
//     '<div class="cell color">' +
//     '  <div class="box"></div>' +
//     "  <ul>" +
//     '    <li class="rgb"></li>' +
//     '    <li class="hex"></li>' +
//     '    <li class="hsl"></li>' +
//     "  </ul>" +
//     "</div>";

// var img = element.querySelector("img");
// img.src = URL.createObjectURL(file);
// img.onload = function () {
//   var rgb = getAverageColor(img);
//   var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
//   var rgbStr = "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
//   var hexStr =
//     "#" +
//     ("0" + rgb.r.toString(16)).slice(-2) +
//     ("0" + rgb.g.toString(16)).slice(-2) +
//     ("0" + rgb.b.toString(16)).slice(-2);
//   var hslStr =
//     "hsl(" +
//     Math.round(hsl.h * 360) +
//     ", " +
//     Math.round(hsl.s * 100) +
//     "%, " +
//     Math.round(hsl.l * 100) +
//     "%)";

//   var box = element.querySelector(".box");
//   box.style.backgroundColor = rgbStr;

//   element.querySelector(".rgb").textContent = rgbStr;
//   element.querySelector(".hex").textContent = hexStr;
//   element.querySelector(".hsl").textContent = hslStr;
// };

//   document.getElementById("images").appendChild(element);
// }

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

function handleImages(files) {
  document.getElementById("images").innerHTML = "";

  for (var i = 0; i < files.length; i++) {
    addImage(files[i]);
  }
}

document.ondragover = function (event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
};

document.ondrop = function (event) {
  event.preventDefault();
  handleImages(event.dataTransfer.files);
};

// (function () {
//   var upload = document.getElementById("upload");
//   var target = document.getElementById("target");

//   upload.onchange = function () {
//     handleImages(this.files);
//   };

//   target.onclick = function () {
//     upload.click();
//   };
// })();
