var $ = require("./lib/qsa");
var score = require("./score");

$(".multiple-choice.question").forEach(function(container) {

  container.classList.add("ready");
  var chosen = false;

  var choose = function() {
    if (chosen) return;
    chosen = true;
    this.classList.add("chosen");
    container.classList.add("answered");
    var correct = this.hasAttribute("data-correct");
    if (correct) {
      container.classList.add("correctly");
    }
    score.increment(correct ? 10 : 0);
  };

  $(".options li", container).forEach(el => el.addEventListener("click", choose));

});