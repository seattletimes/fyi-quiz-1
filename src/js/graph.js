var $ = require("./lib/qsa");
var colors = require("./lib/colors");
var savage = require("savage-query");
var m = require("./lib/dom");

var score = require("./score");

var graphs = $(".graph.question");

graphs.forEach(function(container) {
  var svg = $.one("svg.graph", container);
  var svgContainer = $.one(".graph-container", container);
  var submit = $.one(".compute", container);

  var answered = false;
  var touched = false;
  submit.disabled = true;

  var xValues = svg.getAttribute("data-x").split(",").map(Number);
  var yValues = svg.getAttribute("data-y").split(",").map(Number);
  var max = Math.max.apply(null, yValues) * 1.2;
  var min = 0;
  var width = svg.getAttribute("width") * 1;
  var height = svg.getAttribute("height") * 1;
  var viewHeight = max - min;
  var viewWidth = Math.round((max - min) / height * width);
  var xScale = x => (x / (xValues.length - 1)) * viewWidth;
  var cut = svg.getAttribute("data-halt");
  if (!cut) {
    cut = (xValues.length >> 1) - 1;
  } else {
    cut = xValues.indexOf(cut * 1);
  }

  svg.setAttribute("viewBox", `0 ${-max} ${viewWidth} ${viewHeight}`);

  var sliced = yValues.slice(0, cut + 1);

  var full = savage.dom("path", {
    class: "full series",
    "stroke-width": max / 100,
    d: yValues.map((y, i) => `${i ? "L" : "M"}${xScale(i)},${-y}`).join(" ")
  });

  var half = savage.dom("polyline", {
    class: "partial series",
    "stroke-width": max / 100,
    points: sliced.map((y, i) => `${xScale(i)},${-y}`).join(" ")
  });

  var userValues = [];
  userValues[cut] = yValues[cut];
  var user = savage.dom("polyline", {
    class: "user series",
    "stroke-width": max / 100
  });

  var grid = savage.dom("g", { class: "grid" }, [
    savage.dom("rect", {
      class: "backdrop",
      x: 0,
      y: -max,
      width: "100%",
      height: "100%"
    })
  ]);

  for (var i = 0; i < xValues.length; i++) {
    if (i == cut) continue;
    grid.appendChild(savage.dom("line", {
      x1: xScale(i),
      y1: -max,
      x2: xScale(i),
      y2: 0,
      "vector-effect": "non-scaling-stroke"
    }));
  }

  var intervals = [.1, 1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000];
  var interval;
  for (var i = 0; i < intervals.length; i++) {
    var count = max / intervals[i];
    if (count > 3 && count < 15) {
      interval = intervals[i];
      break;
    }
  }
  var first = yValues[0];
  var labelMargin = first * .2;

  for (var i = interval; i < max; i += interval) {
    grid.appendChild(savage.dom("line", {
      class: "grid",
      x1: 0,
      x2: viewWidth,
      y1: -i,
      y2: -i,
      "vector-effect": "non-scaling-stroke"
    }));
    if (i / interval % 2 == 0 && (i < first - labelMargin || i > first + labelMargin)) {
      svgContainer.appendChild(m("div", {
        class: "html-label pad-left",
        style: `top: ${100 - i / max * 100}%`
      }, i.toLocaleString()));
    }
  }

  svg.appendChild(grid);

  // left label
  svgContainer.appendChild(m("div", { class: "html-label under left" }, xValues[0] + ""));

  // right label
  svgContainer.appendChild(m("div", { class: "html-label under right" }, xValues[xValues.length - 1] + ""));

  // cutline label
  svgContainer.appendChild(m("div", {
    class: "html-label under pad-left",
    style: `left: ${(cut) / (xValues.length - 1) * 100}%`
  }, xValues[cut] + ""));

  // value at start 
  svgContainer.appendChild(m("div", {
    class: "html-label pad-left value",
    style: `top: ${100 - yValues[0] / max * 100}%`
  }, yValues[0].toLocaleString()));

  // value at cutline
  grid.appendChild(savage.dom("line", {
    class: "cutline",
    x1: xScale(cut),
    y1: -max,
    x2: xScale(cut),
    y2: 0,
    "vector-effect": "non-scaling-stroke"
  }));
  var cutTop = 100 - yValues[cut] / max * 100;
  var cutLeft = (cut) / (xValues.length - 1) * 100;
  svgContainer.appendChild(m("div", {
    class: "html-label pad-left value",
    style: `top: ${cutTop}%; left: ${cutLeft}%;`
  }, yValues[cut].toLocaleString()));

  svg.appendChild(half);
  svg.appendChild(user);
  svg.appendChild(full);
  
  svg.appendChild(savage.dom("rect", {
    x: xScale(cut - .5),
    y: -max,
    width: "100%",
    height: max,
    class: "hit-zone"
  }));

  var move = function(e) {
    var bounds = svg.getBoundingClientRect();
    var x = (e.clientX - bounds.left) / bounds.width;
    var y = (e.clientY - bounds.top) / bounds.height;
    var index = Math.round(x * (xValues.length - 1));
    if (index < cut + 1) return;
    if (!touched) {
      touched = true;
      submit.disabled = false;
    }
    var value = (1 - y) * max;
    userValues[index] = value;
    user.setAttribute("points", userValues.map(function(v, i) {
      if (v) return `${xScale(i)},${-v}`;
    }).filter(p => p).join(" "));
  }

  svg.addEventListener("mousemove", function(e) {
    if (answered || e.buttons != 1) return;
    move(e);
  });

  svg.addEventListener("touchmove", function(e) {
    if (answered) return;
    move(e.touches[0]);
  });

  svg.addEventListener("mousedown", e => e.preventDefault());
  svg.addEventListener("touchstart", e => e.preventDefault());

  submit.addEventListener("click", function() {
    answered = true;
    container.classList.add("answered");

    savage(full).addClass("show").draw(2000);

    var errors = [];
    for (var i = cut; i < yValues.length; i++) {
      var expected = yValues[i];
      var got = userValues[i] || 0;
      var margin = Math.abs((got - expected) / expected);
      errors.push(margin);
    }
    var average = errors.reduce((total, v) => v + total, 0) / errors.length;
    var percent = (average * 100).toFixed(1);

    var result = $.one(".result", container);
    var points = 0;
    if (average > .1) {
      result.innerHTML = `<b>0 points</b>Your prediction was off by more than 10% on average`;
    } else if (average > .05) {
      result.innerHTML = `<b>5 points</b>Your answer was within ${percent}% of reality on average`;
      points = 5;
    } else {
      result.innerHTML = `<b>10 points</b>Your predictions were within 5% of the actual value`;
      points = 10;
    }
    if (points) container.classList.add("correctly");

    score.increment(10);
  });

  container.classList.add("ready");
});