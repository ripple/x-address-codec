'use strict';

function seqEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

// Concatenates args and/or contents of sequence conforming args to an Array.
function toArray() {
  const args = arguments;
  if (args.length === 1 && Array.isArray(args[0])) {
    return args[0];
  }
  const ret = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.length !== undefined) {
      for (let j = 0; j < arg.length; j++) {
        ret.push(arg[j]);
      }
    } else {
      ret.push(arg);
    }
  }
  return ret;
}

function isSet(o) {
  return o !== null && o !== undefined;
}

module.exports = {
  seqEqual,
  toArray,
  isSet
};
