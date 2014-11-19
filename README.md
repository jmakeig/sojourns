Experimental sandbox for MarkLogic Server-Side JavaScript API.

### Search
```javascript
ml.collection("jeopardy")
  .where(cts.andQuery(["america", "president"]))
  .orderBy({property: "value", direction: "descending"})
  .page(2, 4)
  .search();
```

### Value Tuples
```javascript
ml.collection("jeopardy")
  .page(2)
  .values(
    ["category", "value", "round"] 
  );
```

```json
[
  {
    "value": [
      "BEFORE & AFTER",
      "$400",
      "Double Jeopardy!"
    ],
    "frequency": 91
  },
  {
    "value": [
      "BEFORE & AFTER",
      "$800",
      "Double Jeopardy!"
    ],
    "frequency": 86
  }
]
```

### Buckets

#### Static

```javascript
ml.collection("jeopardy")
  .values(
    "value",
    ["$3", "$6"] 
  );
```

```json
[
  {
    "value": {
      "minimum": "$1,000",
      "maximum": "$2547",
      "upper-bound": "$3"
    },
    "frequency": 98737
  },
  {
    "value": {
      "minimum": "$3,000",
      "maximum": "$585",
      "lower-bound": "$3",
      "upper-bound": "$6"
    },
    "frequency": 61772
  },
  {
    "value": {
      "minimum": "$6,000",
      "maximum": "$900",
      "lower-bound": "$6"
    },
    "frequency": 52787
  }
]
```
#### Calculated
```javascript
var ml = require("src/QueryBuilder");
Array.from(
ml.where()
  .page(15)
  .values("air_date", function(min, max) {
    return ml.buckets.byMonth(min, max, 1);
  }, {order: "item", direction: "descending"})
).map(
  function(facet) {
    return facet.item["lower-bound"] + " - " 
      + facet.item["upper-bound"] + " " 
      + [
          (new Array(Math.floor(facet.frequency / .5))).join("*︎"), 
          "(" + facet.frequency + ")"
        ].join(" ");
  }
);
```

```json
[
  "2012-01-01 - 2012-02-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (13)",
  "2011-12-01 - 2012-01-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (11)",
  "2011-11-01 - 2011-12-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (11)",
  "2011-10-01 - 2011-11-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (23)",
  "2011-09-01 - 2011-10-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (9)",
  "2011-08-01 - 2011-09-01 (0)",
  "2011-07-01 - 2011-08-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (15)",
  "2011-06-01 - 2011-07-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (16)",
  "2011-05-01 - 2011-06-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (13)",
  "2011-04-01 - 2011-05-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (20)",
  "2011-03-01 - 2011-04-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (9)",
  "2011-02-01 - 2011-03-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (14)",
  "2011-01-01 - 2011-02-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (17)",
  "2010-12-01 - 2011-01-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (9)",
  "2010-11-01 - 2010-12-01 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (15)"
]

```


