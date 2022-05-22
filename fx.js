export const go = (...args) => reduce((a, f) => f(a), args)
export const pipe = (f, ...fs) => (...els) => go(f(...els), ...fs)
export const curry = f => 
  (el, ..._) => _.length ? f(el, ..._) : (..._) => f(el, ..._)

export const map = curry((f, iter) => {
  let res = []
  for (const el of iter) {
    res.push(f(el))
  }
  return res
})

export const filter = curry((f, iter) => {
  const res = []
  for (const el of iter) {
    if (f(el)) res.push(el)
  }
  return res
})

export const reduce = curry((f, acc, iter) => {
  if (!iter) {
    iter = acc[Symbol.iterator]()
    acc = iter.next().value
  }
  for (const el of iter) {
    acc = f(acc, el)
  }
  return acc
})