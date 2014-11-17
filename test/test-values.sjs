'use strict';

var assert = require("assert.sjs");
var ml = require("../src/QueryBuilder.sjs");

module.exports = {
  oneCategoryDefaults: function() {
    var facet = Array.from(ml.where().values("category"))[0];
    assert.equals(facet.item, "FICTIONAL CHARACTERS");
    assert.equals(facet.frequency, 8);
  },
  allCategories: function() {
    // XQuery: count(cts:values(cts:json-property-reference("category"), (:start:)(), (:options:)()))
    assert.equals(
      Array.from(ml.where().values("category")).length,
      Array.from(cts.values(cts.jsonPropertyReference("category"))).length
    );
  }
}
