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

var util = require('/lib/sojourns/util');
var buckets = require("/lib/sojourns/buckets");

/** @private */
function bind(f) {
  return function() {
    var that = (this instanceof QueryBuilder) ? this : new QueryBuilder();
    return f.apply(that, arguments);
  }
}

/** 
 * Avoid new construnction without having to declare it in each function.
 * @private
 */
function chain(f) {
  return function() {
    var that = (this instanceof QueryBuilder) ? this : new QueryBuilder();
    f.apply(that, arguments); // Pass through arguments
    return that;
  }
}

/** 
 * Given a generator, evaluate it eagerly and return results as an `Array`. This is 
 * mostly a development-time convenience that subverts the benefits of lazy loading. 
 * Don’t use it on large result sets.
 * @param {GeneratorFunction} g - A generator. Arguments are automatically passed through.
 * @return {function} - A wrapping function that “unwinds” a generator into an `Array`.
 * @private 
 */
function eager(g) {
  return function() {
    return util.arrayFrom(g.apply(this, arguments));
  }
}

/** 
 * Reuses or creates a `QueryBuilder` and sets it as `this` when applying 
 * the wrapped generator. 
 * http://stackoverflow.com/a/27412999/563324
 * @param {GeneratorFunction} gen - The generator to be wrapped
 * @return {GeneratorFunction}
 * @private 
 */
function delegate(gen) {
  return function*() {
    var that = (this instanceof QueryBuilder) ? this : new QueryBuilder();
    yield *gen.apply(that, arguments);
  }
}

/** 
 * @module QueryBuilder 
 * @description Description here
 * @example <caption>Module documentation</caption>
 * ml.where({a: "A"}).page(1,10);
 */

/**
 * @class QueryBuilder 
 * @example <caption>Search</caption>
 * var ml = require('/lib/sojourns/QueryBuilder');
 * var results = 
 *   ml.collection('jeopardy')
 *     .where('aardvark')
 *     .page(10, 1)
 *     .search();
 * for(var result of results) {
 *   result;
 * }
 * @example <caption>Values</caption>
 * var ml = require('/lib/sojourns/QueryBuilder');
 * var results = 
 *   ml.collection('jeopardy')
 *     .where('aardvark')
 *     .page(10, 1)
 *     .values();
 * for(var result of results) {
 *   result;
 * }
 */
 
/**
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
   * Scopes to a specific collection. This is equivalent to and’ing on a `cts.collectionQuery()` 
   * to any `.where()` conditions, but a lot less typing. In the absence of a standard 
   * “root element”, as in XML, it’s also useful to be able to organize JSON documents by 
   * “type” using collections. For example, all documents representing users could be 
   * stored in the `Users` collection and scope in queries or aggregates with 
   * `.collection('Users')`.
   * @param {string|string[]} [uris] - The collection URI. Multiple collections are ORed together.
   * @return {QueryBuilder} The current instance for chaining
   * @function
   */
  collection: chain(function(uris) {
    if(!util.isUndefined(uris) && !util.isNull(uris)) {
      var uris = [].concat.apply([], Array.prototype.slice.call(arguments));
      if(uris.length > 0) { // Handles case of empty array
        this.state.collections = uris;
      }
    }
  }),
  /**
   * Filter the inputs based on a `cts.query`.
   * @param {string|cts.query} [query] - A `cts.query` instance or a string that will be wrapped in a `cts.wordQuery`.
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
   * @example <caption>Random results. Pair with `.page()` for sampling.</caption>
   * .orderBy("random")
   * @example <caption>Score, descending. The default if no arguments are specified or `.where()` is never called.</caption>
   * .orderBy({score: true}) 
   * @example <caption>JSON property age ascending then by score descending for ties.</caption>
   * .orderBy([{property: "age", direction: "ascending" }, {score: true}])
   * @param {SortSpec[]|string} sortSpecs - Ordered range index and direction pairs or the single string "random".
   * @param {string} [scoring] -   One of logtfidf, logtf, simple, random, or zero
   * @return {QueryBuilder} The current instance for chaining
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
   *   scoring: "logtfidf"| "logtf" | "simple" | "random" | "zero",
   *   checked: true|false,
   *   faceted: true|false,
   * }
   */

  /**
   * Run a search
   * @example <caption>Iterate over the results</caption>
   * for(var result of ml.where("my text").search()) {
   *   // 
   * }
   * @param {SearchOptions} [options] - The options. See the defaults on {@link SearchOptions}.
   * @param {number} [qualityWeight=1]
   * @param {string[]|number[]} [forests]
   * @return {Iterator} Yields individual results for use in a `for…of` loop
   * @function
   */
  search: delegate(function* (options /* FIXME: Change to SearchOptions above */, qualityWeight, forests) {
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
  }),  

  /**
   * Estimate the number of matches to a query unfiltered, using only the indexes.
   * @return {number}
   * @function
   */
  estimate: bind(function() {
    return cts.estimate(this.getQuery()).valueOf();
  }),
  
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
  /**
   * Generator that gets values and frequencies from lexicons.
   * * Single lexicon or `ml.union()` of multiple lexicons: Uses `cts.values()` to get distinct values and their frequencies, optionally starting at the scalar `ranges` value. 
   * * Single lexicon or `ml.union()` with ranges: Uses `cts.valueRanges()` to get buckets and their frequencies
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
   * @example <caption>The static `ml.union()` constructor allows you to specify that lexicons are merged. Without it you’d get the equivalent of `cts.valueTuples()`, where each lexicon is a “column”.</caption>
   * ml.collection('jeopardy')
   *   .values(
   *     ml.union(['category', 'round'])
   *   );
   *
   * @param {string|string[]|cts.reference|cts.reference[]} rangeIndexes - One or more 
   *    range index names. One or a union (`ml.union()`) will use `cts.values()` or 
   *    `cts.valueRanges()`, depending on the `ranges` parameter. Two or more will use 
   *    `cts.tuples()`, resulting in tuples of multiple “columns”.
   * @param {*|Array|Function} [ranges] - A list of the internal boundaries of groupings or a single starting value. 
   *    Values must all be the same type as the index itself. 
   *    For example, `[0, 50, 100]` will result in 4 ranges: `< 0`, `[0–50)`, `[50–100)`, 
   *    and `>= 100`. 
   *    `ranges` can also be a callback function with a signature of `function(min, max)`. You can 
   *    use the minimum and maximum values to scale the buckets. This only applies to a 
   *    on “column” of a single type, either one lexicon or the union of multiple lexicons 
   *    of the same data type. The function must return an array of range bounds as above.
   * @param {object} [options] - 
   * ```
   * {
   *   order: "frequency" | "item", 
   *   frequency: "fragment" | "item", 
   *   direction: "ascending" | "descending", 
   *   limit: Number, 
   *   skip: Number, 
   *   sample: Number, 
   *   truncate: Number,
   *   score: "logtfidf" | "logtf" | "simple" | "random" | "zero"
   * }
   * ```
   * @param {string|string[]} [forests]
   * @param {number} [qualityWeight]
   * @return {Iterator}
   * @function
   */
  values: delegate(function* (rangeIndexes, ranges, options) {
    // Declare intent to union indexes, not cross product as tuple "columns"
    var isUnion = 'string' !== typeof rangeIndexes && rangeIndexes.hasOwnProperty('union');
    rangeIndexes = isUnion ? rangeIndexes.union : rangeIndexes;
    rangeIndexes = [].concat(rangeIndexes).map(
      function(ref) { 
        if(typeof ref === 'string') {
          return cts.jsonPropertyReference(ref); 
        } // else if(isLexicon(ref)) {
          return ref;
        // }
        // throw new Error(ref.toString() + " is not a lexicon");
      }
    );
    // Array of data types of input range indexes
    var rangeIndexTypes = rangeIndexes.map(function(ref) {
      return referenceDataType(ref).type;
    });
    
    // Default to frequency order descending and including empty ranges 
    var defaults = { 
      order: "frequency",
      direction: "descending",
      empties: true
    };
    // Get the limit
    if(this.state.page && this.state.page.limit) {
      // FIXME: Should the page state apply to the documents matched by the query or the 
      //        values() output? The former is probably more correct, but the latter is 
      //        more convenient. 
      //        The current implementation uses the page state to apply to the values output
      //        not the documents matching the query as input.
      defaults.limit = this.state.page.limit;
    }
    options = options || {};
    // If there is no explicit option for each default, set its default value
    for(var d in defaults) {
      if(!options[d]) { 
        options[d] = defaults[d]; 
      }
    }
    
    
    // Options are specified as an array of strings. "Flatten" the option object.
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
        case "limit":     // Return no more than N values.
        case "skip":      // Skip over fragments selected by the cts:query to treat the Nth fragment as the first fragment. Values from skipped fragments are not included. This option affects the number of fragments selected by the cts:query to calculate frequencies.
        case "sample":    // Return only values from the first N fragments after skip selected by the cts:query. This option does not affect the number of fragments selected by the cts:query to calculate frequencies.
        case "truncate":  // Include only values from the first N fragments after skip selected by the cts:query. This option also affects the number of fragments selected by the cts:query to calculate frequencies.
          opts.push(opt + "=" + options[opt]);
          break;
        case "map":
        /* The "map" option groups by key. It's only supported on co-occurrences 
         * (i.e. valueTuples with exactly two references). You also can't get frequency
         * from the map (even in XQuery).
         *
         * {
         *   "$16,400": "PLUS 8",
         *   "$3,500": [
         *     "PEN NAMES",
         *     "POPULATION-POURRI"
         *   ], // Currently ValueIterator. Need to call .toArray()
         *   "$1,400": [
         *     "ANNUAL EVENTS",
         *     "SHAKESPEARE"
         *   ],
         *   …
         * }
         */
         if(true === options[opt] && 2 === rangeIndexes.length) { 
          opts.push(opt); 
         }
         break;
        case "empties": // This is handled below because it only applies to cts.valueRanges()
        case "concurrent":
        case "timezone":
          // Unsupported
          break;
        default:
          break;
      }
      var qualityWeight = options["qualityWeight"];
      //var forests = if(options["forests"]) { options["forests"].map(function(f) { if(f instanceof String) { return xdmp.forest(f); } else {return f;}}); }
      
      // The scoring applies to the documents matched by the query and how they're ordered in the case of truncation.
      opts.push(this.getScoring());
    }
    var itr;
    if(1 === rangeIndexes.length || isUnion) { // FIXME: cts.values() supports multiple inputs. These are union-ed together, which is pretty powerful.
      if(!ranges || (!Array.isArray(ranges) && 'function' !== typeof ranges)) {
        // cts.values with (optional) start param
        itr = cts.values(rangeIndexes, ranges || null, opts, this.getQuery());
      } else if(ranges && (Array.isArray(ranges) || 'function' === typeof ranges)) {
        // "empties" param only applies to ranges in cts.valueRanges
        if(true === options["empties"]) opts.push("empties");
        // If ranges is a function call it, passing the min and max values.
        // This is useful for scaling where you need to know the absolute range.
        if('function' === typeof ranges) {
          ranges = ranges.call(this, 
            cts.min(rangeIndexes[0], null, this.getQuery()).valueOf(), 
            cts.max(rangeIndexes[0], null, this.getQuery()).valueOf()
          ).map(function(value) { return castAs(value, rangeIndexes[0]); });
        }
        itr = cts.valueRanges(rangeIndexes, ranges, opts, this.getQuery());
      }
    } else {
      if(2 === rangeIndexes.length && options['map']) {
        itr = cts.valueCoOccurrences(rangeIndexes[0], rangeIndexes[1], opts, this.getQuery());
      } else {
        itr = cts.valueTuples(rangeIndexes, opts, this.getQuery());
      }
    }
    if(itr instanceof ValueIterator) { // Eagerly evaluated co-occurrences won't return a ValueIterator
      for(var value of itr) {
        var frequency = cts.frequency(value).valueOf();
        if(value instanceof Value && !(value instanceof Node) && (rangeIndexes.length === 1 || isUnion)) {  // cts.values
          // cts.values: 
          // { <-- output
          //   "item": "2001-04-30",   <-- input
          //   "frequency": 6
          // }
          value = value.valueOf();
        } else if(value instanceof Value && rangeIndexes.length > 1 && !isUnion) {
          // cts.valueTuples: 
          // { <-- output
          //   "item": [ <-- input
          //     "1987-04-07",  // air_date
          //     "$200",        // value
          //     607            // show_number
          //   ],
          //   "frequency": 3
          // }
          value = value.toObject().map(function(v, i) {
            // Strongly type date and dateTime types to JavaScript Dates
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
          // cts.valueRanges (min and max only if there are values, lower- upper-bound with empties too)
          // { <-- output
          //   "item": { <-- input
          //     "minimum": "1984-12-06",
          //     "maximum": "1984-12-07",
          //     "lower-bound": "1984-12-01",
          //     "upper-bound": "1985-01-01"
          //   },
          //   "frequency": 3
          // }
          value = value.toObject();
          for(var p in value) {
            // Strongly type date and dateTime types to JavaScript Dates
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
          throw new Error("Unable to handle the output");
        }
        yield { 
          "item": value, 
          "frequency": frequency
        }
      }
    } else {
      yield itr; // It's not actually an iterator, its an eagerly assembled Object from co-occurrence
    }
  }),
  plan: bind(function(){
    return cts.plan(this.getQuery());
  }),
  /**
   * Register a query for later use.
   * @return {number} - The query id
   */
  //register: bind(function() {
  //// TODO: Keep in a local cache?
  //  return cts.register(this.getQuery());
  //}),
  /** 
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
  /** @private */
  getScoring: function() {
    if(this.state.orderBy && this.state.orderBy.scoring)
      return "score-" + this.state.orderBy.scoring;
    else 
      return undefined;
  },
  /**
   * Get string version of internal state for debugging.
   * @return {string}
   */
  toString: function() {
    function str(obj, name) {
      if(obj) return name + ": " + JSON.stringify(obj) + "\n";
      else return "";
    }
    return str(this.state.collections, "collections") + str(this.state.query, "query");  
  }, 
  /**
   * Get the internal state as a JSON object. 
   */
  toJSON: function() {
    return this.state.toJSON()
  }
}

// TODO: Use an `eager` option in `search()` to trigger this an make this 'protected'
QueryBuilder.prototype.searchEager = bind(eager(QueryBuilder.prototype.search));
QueryBuilder.prototype.valuesEager = bind(eager(QueryBuilder.prototype.values));


/** @private */
function isLexicon(ref) {
  if(!ref) return false;
  else return (ref instanceof Value); // Lame-o!
    //&& ["cts.uriReference()", "cts.collectionReference([])"].indexOf(ref.toString()) >= 0;
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


/**
 * @memberOf class:QueryBuilder
 * @static
 */
function union(refs) {
  if(Array.isArray(refs)) {
    return {
      union: refs
    };
  }
  return refs;
}

/** @namespace ml */
module.exports = {
  // Prototype
  collection: QueryBuilder.prototype.collection,
  where: QueryBuilder.prototype.where,
  page: QueryBuilder.prototype.page,
  search: QueryBuilder.prototype.search,
  estimate: QueryBuilder.prototype.estimate,
  values: QueryBuilder.prototype.values,
  
  // Static
  union: union,
  buckets: buckets
  
  // TODO: Remove these in favor of config
  ,searchEager: QueryBuilder.prototype.searchEager,
  valuesEager: QueryBuilder.prototype.valuesEager,
}
