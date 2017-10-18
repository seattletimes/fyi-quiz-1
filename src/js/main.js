require("./lib/social");
require("./lib/ads");
require("./lib/comments");
// var track = require("./lib/tracking");

require("./multiple-choice");
require("./graph");

var savage = require("savage-query");

var layers = ["#Skyline"];
for (var i = 1; i <= 6; i++) {
  layers.push(`#Firework_${i}`);
}

layers = layers.map(id => document.querySelector(id));
layers.forEach(el => el.style.display = "none");

var delay = 2000;

var tick = function() {
  var layer = layers.shift();
  layer.style.display = "block";
  if (layer.id != "Skyline") delay = 500;
  savage(layer).find("path").draw(delay);
  if (layers.length) setTimeout(tick, delay);
};

tick();