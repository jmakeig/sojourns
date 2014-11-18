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
  .values("air_date", 
    // Callback gets the min and max values in order to calculate ranges
    function(min, max) {
      return ml.buckets.byWeek(min, max);
    }, 
    {order: "item", direction: "ascending"}
  )
);
```

```json
[
  {
    "item": {
      "minimum": "1984-09-14",
      "maximum": "1984-09-14",
      "lower-bound": "1984-09-14",
      "upper-bound": "1984-09-21"
    },
    "frequency": 3
  },
  {
    "item": {
      "minimum": "1984-09-27",
      "maximum": "1984-09-27",
      "lower-bound": "1984-09-21",
      "upper-bound": "1984-09-28"
    },
    "frequency": 2
  },
  {
    "item": {
      "lower-bound": "1984-09-28",
      "upper-bound": "1984-10-05"
    },
    "frequency": 0
  },
  {
    "item": {
      "lower-bound": "1984-10-05",
      "upper-bound": "1984-10-12"
    },
    "frequency": 0
  }
]
```