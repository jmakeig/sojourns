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
