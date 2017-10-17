var $ = require("./lib/qsa");

var total = $(".question").length;
var answered = 0;
var score = 0;

var facade = {
  increment: function(points) {
    answered++;
    if (points) score += points;
    console.log(answered, points, score, total);
    if (answered == total) {
      $.one(".score-block").innerHTML = `
You got <div class="score-correct">${score}</div> out of ${total * 10} points!
      `
    }
  }
}

module.exports = facade;