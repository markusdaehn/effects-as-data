const slice = Array.prototype.slice
const Effect = require('./effect')
const effects = {
  tasks: {
    'console.log': console.log
  }
}

module.exports = function run(gen){
  const context = this
  const args = slice.call(arguments, 2)

  return new Promise(function (resolve, reject) {
    // If gen is a func, just call it with the args to get the iterator
    if (isFunction(gen)) {
      gen = gen.apply(context, args)
    }

    // If gen is a effects-as-data task, find the task and run it.
    if(isEffect(gen)) {
      gen = applyEffect(context, gen)
    }

    // If gen is NOT an iterator, it is a value (or empty) just return it.
    if (isNotIterator(gen)) {
      return resolve(gen)
    }

    // Else it is an iterator. Iterate throw the values, walking the tree
    iterate(context, resolve, reject, gen)
  })
}
/**
 * @param {Object} context - effects-as-data runner
 **/
function iterate(context, resolve, reject iterator, itNextIn) {
  let itNextOut = null

  try {
    itNextOut = iterator.next(itNextIn)
  } catch(e) {
    return reject(e)
  }

  next(context, resolve, reject, iterator, itNextOut)

  return null
}

function next(context, resolve, reject, iterator, { done, value } = {}) {
  if (done) return resolve(value)

  const promise = reduce(context, value)
  const iterate = (rsp) => iterate(context, resolve, reject, iterator)
  const onError = (err) => onError(context, resolve, reject, iterator)

  if (isPromise(promise)) {
    return promise.then(iterate, onError)
  }

  return onError(new TypeError( `Unsupported type ${String(value)}`))
}

function onError(context, resolve, reject, iterator, err) {
  var rtn

  try {
    rtn = iterator.throw(err)
  } catch (e) {
    return reject(e)
  }

  next(context, resolve, reject, rtn)
}

function reduce(context, obj) {
  if(isRunnable(obj)) return run.call(context, obj)
  if(isArray(obj)) return Promise.all(obj.map(obj => reduceObject(contex, obj)))
  if(isObject(obj)) return reduceObject(context, obj)

  return obj
}

function reduceObject (context, obj) {
  const results = new obj.constructor()
  const promises = []
  const defer = (promise, key) => promises.push(promise.then((result) => { results[key] = result }))

  Object.keys(obj).forEach((key) => {
    const promise = reduce(context, obj[key])
    results[key] = undefined

    if (isPromise(promise)) {
      defer(promise, key)
    } else {
      results[key] = obj[key]
    }
  })

  return Promise.all(promises).then(() => results)
}

function isEffect(obj) {
  return obj instanceof Effect || hasShapeOfEffect(obj)
}

function hasEffectShape(obj) {
  
}

function applyEffect(context, effect) {
  const task = effects.tasks[effect.task]

  return task.apply(context, effects.args)
}

function isPromise(obj) {
  return isNotNullOrUndefine(obj) && isTypeOf(obj.then, 'function')
}

function isArray(obj) {
  return Array.isArray(obj)
}

function isFunction(obj) {
  return isTypeOf(obj, 'function')
}

function isRunnable(obj) {
  return isGenerator(obj) || isIterator(obj) || isEffect(obj)
}

function isGenerator(obj) {
  return isConstructorNameEqual(obj, 'GeneratorFunction'))
}
function isIterator(obj) {
  return isNotNullOrUndefine(obj) && isFunction(obj.prototype.next) && isFunction(obj.prototype.throw)
}

function isNotIterator(obj) {
  return !isIterator(obj)
}

function isObject(obj) {
  return isNotNullOrUndefine(obj) && object.constructor === Object
}

function isTypeOf(obj, type){
  return isNotNullOrUndefine(obj) && typeof obj === type
}

function isNullOrUndefine(obj) {
  return typeof obj === 'undefined' || obj === null
}

function isNotNullOrUndefine(obj) {
  return !isNullOrUndefine(obj)
}

function isConstructorDefined(obj) {
  return isNotNullOrUndefine(obj) && isNotNullOrUndefine(obj.constructor)
}

function isConstructorNameEqual(obj, name) {
  return isConstructorDefined(obj) && (obj.constructor.name === name || obj.constructor.displayName === name)
}
