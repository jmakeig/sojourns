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
'use strict';

require('/lib/sojourns/util.sjs');
//var buckets = require("/lib/sojourns/buckets.sjs");

// Avoid new construnction without having to declare it in each function.
function chain(f) {
  return function() {
    var that = (this instanceof QueryBuilder) ? this : new QueryBuilder();
    f.apply(that, arguments); // Pass through arguments
    return that;
  }
}

/** 
 * @module QueryBuilder 
 * @description Description here
 * @example <caption>asdf</caption>
 * ml.where({a: "A"}).page(1,10);
 */

/**
 * @alias module:QueryBuilder
 * @constructor
 * @private
 */
function QueryBuilder() {
  this.state = {
/*
    collections: undefined,
    query: undefined,
    orderBy: {},
    page: undefined
*/
    query: xdmp.toJSON(cts.andQuery([])).toObject()
  };
}
QueryBuilder.prototype = {
  /**
   * Scopes to a specific collection. This is equivalent to and’ing on a `cts.collectionQuery()` to any `.where()` conditions, but a lot less typing. In the absence of a standard “root element”, as in XML, it’s also useful to be able to organize JSON documents by “type” using collections. For example, all documents representing users could be stored in the `Users` collection and scope in queries or aggregates with `.collection('Users')`.
   * @param {string|string[]} [uris] - The collection URI. Multiple collections are ORed together.
   * @return {QueryBuilder} The current instance for chaining
   * @function
   */
  collection: chain(function(uris) {
    var uris = [].concat.apply([], Array.prototype.slice.call(arguments));
    this.state.collections = uris;
  }),
  /**
   * Filter the inputs based on a cts.query.
   * @param {string|cts.query} [query] - A cts.query instance or a string that will be wrapped in a cts.wordQuery.
   * @return {QueryBuilder} The current instance for chaining
   * @function
   */
  where: chain(function(query) {
    if(typeof query == "string") {
      query = cts.wordQuery(query);
    }
    this.state.query = xdmp.toJSON(query).toObject(); // FIXME: This is ugly.
  }),
  
  /**
   * Sorting specification
   * @typedef {object} SortSpec
   * @property {string} reference - One of score, property, field, path and then a value corresponding to the name of the range index. For example, { property: "firstName", direction: "ascending" } will sort the JSON property "firstName" in ascending order.
   * @property {string} direction - One of ascending, descending. Defaults to descending for score ordering.
   */
  
  /**
   * Order results by one or more criteria. Defaults to descending relevance score.
   *
   * @example <caption>Random results. Pair with .page() for sampling.</caption>
   * .orderBy("random")
   * @example <caption>Score, descending. The default if no arguments are specified or `.where()` is never called.</caption>
   * .orderBy({score: true}) 
   * @example <caption>JSON property age ascending then by score descending for ties.</caption>
   * .orderBy([{property: "age", direction: "ascending" }, {score: true}])
   * @param {SortSpec[]|string} sortSpecs - Ordered range index and direction pairs or the single string "random".
   * @param {string} [scoring] -   One of logtfidf, logtf, simple, random, or zero
   * @function
   */
  orderBy: chain(function(sortSpecs /*{property: "name", direction: "ascending|descending"}*/, scoring /* "logtfidf|logtf|simple|random|zero*/) {    
    this.state.orderBy = {};

    if(1 === arguments.length && "random" === arguments[0]) {
      this.state.orderBy.scoring = "random";
    } else {
      if(scoring) this.state.orderBy.scoring = scoring;
    
      var sortSpecs = [].concat.apply([], Array.prototype.slice.call(arguments));
      //     cts.indexOrder
      //     cts.scoreOrder -> align with score-random
      //     cts.confidenceOrder
      //     cts.fitnessOrder
      //     cts.qualityOrder
      //     cts.documentOrder
      //     cts.unordered
      this.state.orderBy.order = sortSpecs.map(
        function(ss) {
           if(ss.score)
             return cts.scoreOrder(ss.direction || "descending");
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
    }
  }),
  /**
   * Pagination with limit and optional offset.
   * @param {number} limit - The total number of results to be returned.
   * @param {number} [offset] - Starting with the nth result. Counting starts at 1, not zero.
   * @return {QueryBuilder} The current instance for chaining
   * @function
   */
  page: chain(function(limit, offset) {
    this.state.page = { limit: limit, offset: offset };
  }),
  
  /**
   * Search options
   * @typedef {object} SearchOptions
   * @property {boolean} [filtered=false] - Whether to filter at the E-node or only resolve out of the indexes. Defaults to `false`, unfiltered. It is faster, but potentially less accurate.
   * @property {string} [scoring=logtfidf] - The scoring algorithm
   * @property {boolean} [checked=false] - Checked
   * @property {boolean} [faceted=false] - Faceted
   *
   * {
   *   filtered: true|false,
   *   scoring: logtfidf| logtf| simple| random| zero,
   *   checked: true|false,
   *   faceted: true|false,
   * }
   */

  /**
   * Run a search
   * @param {SearchOptions} [options] - The options. See the defaults on {@link SearchOptions}.
   * @param {number} [qualityWeight=1]
   * @param {string[]|number[]} [forests]
   * @return {Iterator} 
   */
  search: function* (options /* FIXME: Change to SearchOptions above */, qualityWeight, forests) {
    options = [].concat(options);
    
    // TODO: Change options to an object and implement proper defaults, like .values()
    if(options.indexOf("unfiltered") < 0 && options.indexOf("filtered") < 0) {
      options.push("unfiltered");
    }
    // FIXME: pushing undefined actually adds an entry
    options.push(this.getScoring());
    if(this.state.orderBy && this.state.orderBy.order) {
      options = [].concat(options, this.state.orderBy.order);
    }
    var itr = cts.search(this.getQuery(), options, qualityWeight, forests);
    if(this.state.page && (this.state.page.limit || this.state.page.offset)) {
      itr = fn.subsequence(itr, this.state.page.offset || 1, this.state.page.limit);
    }
    for(var result of itr) {
      yield result.toObject(); // Assumes JSON documents. TODO: What about XML? Binary?
    }
  },
  /**
   * Estimate the number of matches to a query unfiltered, using only the indexes.
   * @return {number}
   */
  estimate: function() {
    return cts.estimate(this.getQuery()).valueOf();
  },
  /**
   * Generator function that gets values and frequencies from lexicons.
   * * Single lexicon: Uses `cts.values()` to get distinct values and their frequencies
   * * Single lexicon with ranges: Uses `cts.valueRanges()` to get buckets and their frequencies on a single lexicon
   * * Multiple lexicons: Uses `cts.valueTuples()` to get co-occurrences of multiple lexicons per document
   * 
   * @example <caption>Calculated buckets</caption>
   * ml.where()
   *   // Get only the top 15 values, based on the values ordering below
   *   .page(15)
   *   // The ranges callback gives you access to the min and max value for 
   *   // the current set of input documents filtered by the .where().
   *   .values('air_date', function(min, max) { 
   *     // Convenience to build month-long ranges starting on the first day of the month
   *     return ml.buckets.byMonth(min, max, 1); 
   *   }, {order: "item", direction: "descending"})
   * );
   *
   * @param {string|string[]|cts.reference|cts.reference[]} rangeIndexes - One or more range index names. One will use `cts.values()` and two or more will use `cts.tuples()` or `cts.valueRanges()`, depending on the ranges parameter.
   * @param {Array|Function} [ranges] - A list of the internal boundaries of groupings or the starting value. Values should all be the same type as the index itself. For example, `[0, 50, 100]` will result in 4 ranges: `> 0`, `[0–50)`, `[50–100)`, and `>= 100`. `ranges` can also be a callback function with a signature of `function(min, max)`. You can use the minimum and maximum values to scale the buckets.
   * @param {object} [options] - 
   * ```
   * {
   *   order: "frequency|item", 
   *   frequency: "fragment|item", 
   *   direction: "ascending|descending", 
   *   limit: N, 
   *   skip: N, 
   *   sample: N, 
   *   truncate: N, 
   *   score: "logtfidf|logtf|simple|random|zero"}
   * }
   * ```
   * @param {string|string[]} [forests]
   * @param {number} [qualityWeight]
   * @return {Iterator}
   */
   
  /*
      TODO: Implement wildcard matches. This is similar to the $start parameter. 
      Note that in the example multiple indexes interleave. (FIXME: .values() should 
      support multiple instances for cts.values() calls as well.)
      
      (: XQuery :)
      cts:value-match(
        for $p in ('round', 'category') return cts:json-property-reference($p),
        '?ouble*'
      )
      
      ==>
        DOUBLE "D"
        DOUBLE "D"s
        DOUBLE G WHIZ
        Double Jeopardy!
        DOUBLE MEANINGS
        DOUBLE TALK
        DOUBLE THE W
   
  */
  /*
      Function            Input references      Limit/group
      cts.values          union of references   start value (no wildcard)
      cts.valueMatches    union of references   wildcard pattern
      cts.valueRanges     union of references   array of bounds
      cts.valueTuples     array of references   none
  */   
   
  values: function* (rangeIndexes /* String|String[],  */, ranges, options /* {order: "frequency|item", frequency: "fragment|item", direction: "ascending|descending", limit: N, skip: N, sample: N, truncate: N, score: "logtfidf|logtf|simple|random|zero"}, forests: ["name"], qaulityWeight: N } */) {
    rangeIndexes = [].concat(rangeIndexes).map(
      function(ref) { 
        if(typeof ref === "string") {
          return cts.jsonPropertyReference(ref); 
        } else if(isLexicon(ref)) {
          return ref;
        }
        // TODO: Handle the case where you pass in a strongly typed cts.reference
        //throw new Error(ref + " is not a lexicon");
      }
    );
    // Array of data types of input range indexes
    var rangeIndexTypes = rangeIndexes.map(function(ref) {
      return referenceDataType(ref).type;
    });
    options = options || {};
    // TODO: Move this into config
    var defaults = { 
      order: "frequency",
      direction: "descending", 
    };
    if(this.state.page && this.state.page.limit) defaults.limit = this.state.page.limit;
    for(var d in defaults) {
      if(!options[d]) { 
        options[d] = defaults[d]; 
      }
    }
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
        case "empties":
          if(true === options[opt]) {
            opts.push(opt);
          }
          break;
        case "map":
          // Eat this param because it's just formatting. (TODO: Or is it?)
          break;
        default:
          break;
      }
      var qualityWeight = options["qualityWeight"];
      //var forests = if(options["forests"]) { options["forests"].map(function(f) { if(f instanceof String) { return xdmp.forest(f); } else {return f;}}); }
      opts.push(this.getScoring());
    }
    var itr;
    if(1 === rangeIndexes.length) { // FIXME: cts.values() supports multiple inputs. These are union-ed together, which is pretty powerful.
      if(!ranges || (!Array.isArray(ranges) && !(ranges instanceof Function))) {
        // cts.values with (optional) start param
        itr = cts.values(rangeIndexes, ranges || null, opts, this.getQuery());
      } else if(ranges && (Array.isArray(ranges) || (ranges instanceof Function))) {
        // "empties" param only applies to ranges in cts.valueRanges
        // Default to displaying empties
        if(!("empties" in options) || true === options["empties"]) opts.push("empties");
        // cts.valueRanges with required bounds
        if(ranges instanceof Function) {
          ranges = ranges.call(this, 
            // https://github.com/lodash/lodash/blob/2.4.1/dist/lodash.compat.js#L3074
            cts.min(rangeIndexes[0], null, this.getQuery()).valueOf(), 
            cts.max(rangeIndexes[0], null, this.getQuery()).valueOf()
          ).map(function(value) { return castAs(value, rangeIndexes[0]); });
        }
        itr = cts.valueRanges(rangeIndexes, ranges, opts, this.getQuery());
      }
    } else {
      itr = cts.valueTuples(rangeIndexes, opts, this.getQuery());
    }
    for(var value of itr) {
      // var v;
      /***************************************************/
      // Start UGLY work-around
      // try {
      //   v = JSON.parse(value.toString()); // FIXME: Ahhh! Kill it with fire! There's something wrong with Value types.
      // } catch(e) {
      //   v = value.valueOf(); // This returns a Value instance, not a primitive, thus === comparisons won't work. Is this the right thing to do?
      // }
      // End UGLY work-around
      /***************************************************/
      var frequency = cts.frequency(value);
      
      if(value instanceof Value && !(value instanceof Node) && rangeIndexes.length === 1) {  // cts.values
        // cts.values
        // {
        //   "item": "2001-04-30",   // air_date
        //   "frequency": 6
        // }
        value = value.valueOf();
      } else if(value instanceof Value && rangeIndexes.length > 1) { // cts.tuples
        // cts.valueTuples
        // {
        //   "item": [
        //     "1987-04-07",  // air_date
        //     "$200",        // value
        //     607            // show_number
        //   ],
        //   "frequency": 3
        // }
        
        // FIXME: https://bugtrack.marklogic.com/30987
        value = JSON.parse(value.toString());
        value = value.map(function(v, i) {
          switch(rangeIndexTypes[i]) {
            case 'date':
            case 'dateTime':
              return new Date(v);
              break;
            default:
              return v;
          }
        });
      } else if(value instanceof Node) {  //cts.valueRanges
        xdmp.log("NODE");
        // cts.valueRanges (min and max only if there are value, l- u-bound with empties too)
        // {
        //   "item": {                        // air_date
        //     "minimum": "1984-12-06",
        //     "maximum": "1984-12-07",
        //     "lower-bound": "1984-12-01",
        //     "upper-bound": "1985-01-01"
        //   },
        //   "frequency": 3
        // }
        value = value.toObject();
        for(var p in value) {
          switch(rangeIndexTypes[0]) {
            case 'date':
            case 'dateTime':
              value[p] = new Date(value[p]);
              break;
            default:
              break;
          }
        }
      } else {
        throw new Error();
      }
      yield { 
        "item": value, 
        "frequency": frequency
      }
    }
  },
  /** 
   * 
   * Passes the current state to a function. Defaults to `xdmp.log()`. 
   * @param {function} [logger=xdmp.log] - The logger that is passed the current state as an `object`.
   * @function
   */
  log: chain(function(logger){
    logger = logger || xdmp.log;
    logger(this.state);
  }),
  /*********************************************************/
  /**
   * Get the `cts.query` version of the query object. Appends the collection query, if it's specified. Uses OR semantics if you specify multiples.
   * @return {cts.query} The query, ready to pass to `cts.search()`
   */
  getQuery: function() {
    var q = (this.state.query) ? cts.query(this.state.query) : null;
    if(this.state.collections) {
      //var coll = cts.orQuery(this.state.collections.map(function(collection) { return cts.collectionQuery(collection); })); 
      q = cts.andQuery([].concat(q, cts.collectionQuery(this.state.collections)));
    }
    return q;
  },
  getScoring: function() {
    if(this.state.orderBy && this.state.orderBy.scoring)
      return "score-" + this.state.orderBy.scoring;
    else 
      return undefined;
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

/** @private */
function isLexicon(ref) {
  if(!ref) return false;
  else return (ref instanceof Value) && ["cts.uriReference()", "cts.collectionReference([])"].indexOf(ref.toString()) >= 0;
}
/** @private */
function getForests(dbName) {
  var forests = xdmp.databaseForests((dbName) ? xdmp.database(dbName) : xdmp.database()).toArray();
  return forests.map(function(f) {
    return { name: xdmp.forestName(f), host: xdmp.hostName(xdmp.forestHost(f)) };
  });
}

/** 
 * Gets the data type of a cts.reference.
 * @param {cts.reference|string} ref - 
 * @return {object} A hash with a `type` and optional `collation` properties. Type is one of `int`, `unsignedInt`, `long`, `unsignedLong`, `float`, `double`, `decimal`, `dateTime`, `time`, `date`, `gYearMonth`, `gYear`, `gMonth`, `gDay`, `yearMonthDuration`, `dayTimeDuration`, `string`, `anyURI`.
 * @private
 */
function referenceDataType(ref) {
  if(!ref) { throw new Error("You must supply a reference as a string or cts.reference"); }
  if('string' === typeof ref) {
    //var collation = lookupCollation(ref);
    var opts = [];
    // TODO: Implement global collation look-up. (Or not.)
    // if(collation) {
    //   opts.push('collation=' + collation);
    // }
    ref = cts.jsonPropertyReference(ref, opts);
  }
  return { type: cts.referenceScalarType(ref) };
/*
  var admin = require('/MarkLogic/admin.xqy');
  var config = admin.getConfiguration();
  var type = {};
  
  // TODO: What about all of the other index types?
  var itr = admin.databaseGetRangeElementIndexes(config, xdmp.database());
  for (var idx of itr) {
    if(idx.xpath('.//localname[. = "' + ref + '"]').toArray().length > 0) {
      type.type = idx.xpath('.//scalar-type/data(.)').valueOf().toString();
      if('string' === type.type) {
        type.collation = idx.xpath('.//collation/data(.)').valueOf();
      }
      return type;
    }
  }
  return undefined;
*/
}

/**
 * Casts a JavaScript type as a schema type, for working with range indexes.
 * @param {object|string|number|Date|boolean} value - The JavaScript value to be cast 
 * @param {cts.reference|string} ref - The range index to get the type information from
 * @return {Value} The cast value as a schema type instance of `Value` 
 * @private
 */
function castAs(value, ref) {
  if(!ref) return xs.anyAtomicType(value);
  var type = referenceDataType(ref);
  return xs[type.type || 'anyAtomicType'](value);
}



module.exports = {
  collection: QueryBuilder.prototype.collection,
  where: QueryBuilder.prototype.where,
  page: QueryBuilder.prototype.page //,
  //buckets: buckets
}
