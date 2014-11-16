/*
 * Copyright 2014 MarkLogic
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/* Avoid new construnction without having to declare it in each function. */
function chain(f) {
  return function() {
    var that = (this instanceof QueryBuilder) ? this : new QueryBuilder();
    f.apply(that, arguments); // Pass through arguments
    return that;
  }
}

function QueryBuilder() {
  this.state = {};
}
QueryBuilder.prototype = {
  collection: chain(function(uris) {
    var uris = [].concat.apply([], Array.prototype.slice.call(arguments));
    this.state.collections = uris;
  }),
  where: chain(function(query) {
    if(typeof query == "string") {
      query = cts.wordQuery(query);
    }
    this.state.query = xdmp.toJSON(query).toObject(); // FIXME: This is ugly.
  }),
  /*
   * { property: "color", direction: "ascending|descending" }
   */
  orderBy: chain(function(sortSpecs /*{property: "name", direction: "ascending|descending"}*/) {
    var sortSpecs = [].concat.apply([], Array.prototype.slice.call(arguments));
    this.state.orderBy = sortSpecs.map(
      function(ss) {
        if(ss.score)
          ;
        else if(ss.property)
          return cts.indexOrder(cts.jsonPropertyReference(ss.property), ss.direction || "ascending"); 
        else if(ss.field)
          throw new Error("No field yet");
        else if(ss.path)
          throw new Error("No path yet");
        else
          throw new Error("None of property, field, path");
      }
    );
  }),
  /*********************************************************/
  search: function* (options /*(String|cts.indexOrder)[]*/, qualityWeight, forests) {
    options = [].concat(options);
    if(options.indexOf("unfiltered") < 0 && options.indexOf("filtered") < 0) {
      options.push("unfiltered");
    }
    options = [].concat(options, this.state.orderBy);
    for(var result of cts.search(this.getQuery(), options, qualityWeight, forests)) {
      yield result.toObject(); // Assumes JSON documents. TODO: What about XML? Binary?
    }
  },
  estimate: function() {
    return cts.estimate(this.getQuery());
  },
  values: function* (rangeIndexes /* String|String[],  */, ranges, options /* {order: "frequency|item", frequency: "fragment|item", direction: "ascending|descending", limit: N, skip: N, sample: N, truncate: N, score: "logtfidf|logtf|simple|random|zero"}, forests: ["name"], qaulityWeight: N } */) {
    rangeIndexes = [].concat(rangeIndexes).map(function(ref) { return cts.jsonPropertyReference(ref); });
    var opts = [];
    for(var opt in options) {
      switch(opt) {
        case "order":
        case "frequency":
          opts.push(options[opt] + "-" + opt);
          break;
        case "direction":
          opts.push(options[opt]);
          break;
        case "limit":
        case "skip":
        case "sample":
        case "truncate":
          opts.push(opt + "=" + options[opt]);
          break;
        default:
          break;
      }
      var qualityWeight = options["qualityWeight"];
      //var forests = if(options["forests"]) { options["forests"].map(function(f) { if(f instanceof String) { return xdmp.forest(f); } else {return f;}}); }
    }
    var itr;
    if(1 === rangeIndexes.length) {
      if(!ranges || !Array.isArray(ranges)) {
        // cts.values with (optional) start param
        itr = cts.values(rangeIndexes, ranges || null, opts, this.getQuery());
      } else if(ranges && Array.isArray(ranges)) {
        // cts.valueRanges with required bounds
        itr = cts.valueRanges(rangeIndexes, ranges, opts, this.getQuery());
      }
    } else {
      itr = cts.valueTuples(rangeIndexes, opts, this.getQuery());
    }
    for(var value of itr) {
      var v;
      // Start UGLY work-around
      try {
        v = JSON.parse(value.toString()); // FIXME: Ahhh! Kill it with fire! There's something wrong with Value types.
      } catch(e) {
        v = value;
      }
      // End UGLY work-around
      yield { 
        "value": v, 
        "frequency": cts.frequency(value)
      }
    }
  },
  /*********************************************************/
  /* Get the cts.query version of the query object. Appends the collection query, if it's specified. Uses OR semantics if you specify multiples. */
  getQuery: function() {
    var q = (this.state.query) ? cts.query(this.state.query) : null;
    if(this.state.collections) {
      //var coll = cts.orQuery(this.state.collections.map(function(collection) { return cts.collectionQuery(collection); })); 
      q = cts.andQuery([].concat(q, cts.collectionQuery(this.state.collections)));
    }
    return q;
  },
  toString: function() {
    function str(obj, name) {
      if(obj) return name + ": " + JSON.stringify(obj) + "\n";
      else return "";
    }
    return str(this.state.collections, "collections") + str(this.state.query, "query");  
  }, 
  toJSON: function() {
    return this.state.toJSON()
  }
}

module.exports = {
  collection: QueryBuilder.prototype.collection,
  where: QueryBuilder.prototype.where
}
