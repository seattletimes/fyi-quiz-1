var $ = require("./lib/qsa");

$(".multiple-choice.question").forEach(function(container) {

  container.classList.add("ready");
  var chosen = false;

  var choose = function() {
    if (chosen) return;
    chosen = true;
    this.classList.add("chosen");
    container.classList.add("answered");
    if (this.hasAttribute("data-correct")) {
      container.classList.add("correctly");
    }
  };

  $(".options li", container).forEach(el => el.addEventListener("click", choose));

});