"use strict";

module.exports = function (markup) {
  if (typeof document !== "undefined") return;
  if (!markup || markup === "") {
    markup = "<html><body></body></html>";
  }
  var jsdom = require("jsdom").jsdom;
  global.document = jsdom(markup || "");
  global.window = document.parentWindow;
  global.navigator = {
    userAgent: "node.js"
  };
};