'use strict';

var assert = require("assert.sjs");
var ml = require("../src/QueryBuilder.sjs");

module.exports = {
  oneCategoryDefaults: function() {
    var facet = Array.from(ml.where().values("category"))[0];
    assert.equals(facet.item, "FICTIONAL CHARACTERS");
    assert.equals(facet.frequency, 8);
  }
}
