'use strict';
var ml = require("QueryBuilder");

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