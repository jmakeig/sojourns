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

var moment = require('/lib/moment.2.8.3.min.sjs');
var m = require('/lib/moment-range.1.0.5.min.sjs');

function valueToDate(value) {
  // FIXME: Work-around for <https://bugtrack.marklogic.com/31445>
  var out = value;
  try { 
    out = value.toObject(); 
  } catch(err) { /* Swallow */ }
  return out;
  //if(value instanceof Value) {
  //  return new Date(value.toObject());
  //}
  //return value;
}

/**
 * Month-long buckets fully containing the start and end dates. Optionally set where to
 * start counting in the month (1-31).
 */
function monthBuckets(start, end, dateStart /* 1-31 */) {
  start = moment(valueToDate(start));
  end = moment(valueToDate(end));

  dateStart = dateStart || start.date();
  
  if(dateStart > start.date()) {
    start.subtract(1, 'months').date(dateStart);
  } else {
    start.date(dateStart); 
  }
  
  if(dateStart < end.date()) {
    end.add(1, 'months').date(dateStart);
  } else {
    end.date(dateStart);
  }
  
  var range = moment().range(start, end);
  var out = [];
  range.by('months', function(moment) {
    out.push(moment.toDate());
  });
  return out;
}

/*
 * Week-long buckets fully containing the start and end dates. Optionally set where to 
 * start counting in the week (0: Sun ... 6: Sat).
 */
function weekBuckets(start, end, dayStart /* 0-6 */) {
  start = moment(start);
  end = moment(end);
  // TODO: Default to 0 and allow passing a Date in for dayStart
  dayStart = (dayStart > 6 || dayStart < 0) ? Math.abs(dayStart % 7) : dayStart; // Keep bounds 0-6
  dayStart = dayStart || start.day();
  dayStart = (start.day() < dayStart) ? dayStart - 7 : dayStart; // Make sure to expand to the left
  
  var range = moment().range(
    start.day(dayStart), 
    end.day(dayStart).add(2, "weeks")
  );
  var out = [];
  range.by("weeks", function(moment) {
    out.push(moment.toDate());
  });
  return out;
}

/** @module Buckets */
module.exports = {
  byMonth: monthBuckets,
  byWeek: weekBuckets
}

// var start = new Date(2001, 3-1, 12);
// var end = new Date(2002, 9-1, 28);
// 
// var buckets = 
// monthBuckets(start, end, 26)
// //weekBuckets(start, end, 0)
//   .map(function(dt){
//   return moment(dt).format("dddd, MMMM Do YYYY");
// });
// 
// [
//   buckets[0],
//   buckets[1],
//   "…" + (buckets.length - 4) + " more…",
//   buckets[buckets.length - 2],
//   buckets[buckets.length - 1]
// ]  
