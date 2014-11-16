'use strict';
var ml = require("../src/QueryBuilder");

xdmp.setResponseContentType("application/json");
var limit = 2500; //parseInt(xdmp.getRequestField("limit", 100), 10);

var itr = ml.collection("jeopardy")
  //.where("American")
  .page(limit)
  .orderBy("random")
  .search();
  
var out = [];
for(var doc of itr) {
  out.push(doc);
}
out;

// clear; curl -fsS --digest --user admin:'********' http://localhost:8765/data/extract-random.sjs | json > ../data/jeopardy.json
// cat jeopardy.json | jq '. | length'