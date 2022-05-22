/* reduce */
const queryStr = pipe(
  Object.entries,
  map(([k, v]) => `${k}=${v}`),
  reduce((a, b) => `${a}&${b}`)
)

queryStr({ limit: 10, offset: 10, type: 'notice' }) // limit=10&offset=10&type=notice

// 리팩토링: 다형성이 높은 join 함수
// Array에서만 사용할 수 있는 Array.join에 비해 상대적으로 다형성, 조합성이 높다.
const join = curry((sep = ',', iter) => 
  reduce((a, b) => `${a}${sep}${b}`, iter))

// (after)
const queryStr2 = pipe(
  Object.entries,
  map(([k, v]) => `${k}=${v}`),
  join('&')
)

// join은 이터러블 프로토콜을 따른다.
// 즉, 위에서 이터러블이 내려오면 지연 평가가 가능하다.
const queryStr3 = pipe(
  Object.entries,
  map(([k, v]) => `${k}=${v}`),
  function(a) {
    console.log(a) // ["limit=10", "offset=10", "type=notice"]
    return a
  },
  join('&')
)

// 이미 평가된 값이 아니라,
// 해당 값을 평가하기로 약속된, 지연된 값을 join에게 던져도 된다.
const queryStr4 = pipe(
  Object.entries,
  L.map(([k, v]) => `${k}=${v}`),
  function(a) {
    console.log(a) // Generator {<suspended>}
    return a
  },
  join('&')
)

// Object.entries는 바로 평가된 값을 리턴하는데,
// 이 역시도 지연 평가를 지원하도록 바꿔줄 수 있겠다.
L.entries = function *(obj) {
  for (const k in obj) yield [k, obj[k]]
}

/* find */
const users = [
  { age: 32 },
  { age: 28 },
  { age: 29 },
  { age: 35 },
  { age: 37 },
]

const find = (f, iter) => go(
  iter,
  filter(f),
  take(1),
  ([a]) => a
)

find(u => u.age < 30, users) // 28

// 위 find 함수의 아쉬운 점
// : 하나의 결과만 필요하지만, 모든 요소를 순회하고 있다.

// 아래는 연산을 지연해, 필요한 값이 나올 때까지 하나씩 꺼내봄
const find2 = (f, iter) => go(
  iter,
  L.filter(f),
  take(1),
  ([a]) => a
)

// currying.
const find3 = curry((f, iter) => go(
  iter,
  L.filter(f),
  take(1),
  ([a]) => a
))

/* L.map + take로 map 만들기 */
// 기존 map
const map = curry((f, iter) => {
  let res = []
  iter = iter[Symbol.iterator]()
  let cur
  while (!(cur = iter.next()).done) {
    const a = cur.value
    res.push(f(a))
  }
  return res
})

// 기존 L.map
L.map = curry(function *(f, iter) {
  iter = iter[Symbol.iterator]()
  let cur
  while (!(cur = iter.next()).done) {
    const a = cur.value
    yield f(a)
  }
})

map(a => a + 10, range(4)) // [10, 11, 12, 13]

// (after)
const map2 = curry((f, iter) => go(
  iter,
  L.map(f), // or: L.map(f, iter)
  take(Infinity)
))

// or
const map3 = curry(pipe(
  L.map,
  take(Infinity)
))

/* L.filter + take로 filter 만들기 */
// 기존 filter
const filter = curry((f, iter) => {
  let res = []
  iter = iter[Symbol.iterator]()
  let cur
  while (!(cur = iter.next()).done) {
    const a = cur.value
    if (f(a)) res.push(a)
  }
  return res
})

// 기존 L.filter
L.filter = curry(function *(f, iter) {
  iter = iter[Symbol.iterator]()
  let cur
  while (!(cur = iter.next()).done) {
    const a = cur.value
    if (f(a)) {
      yield a
    }
  }
})

const filter2 = curry(pipe(L.filter, take(Infinity)))

const takeAll = take(Infinity)
const filter3 = curry(pipe(L.filter, takeAll))
const map4 = curry(pipe(L.map, takeAll))

// 간단한 버전의 L.map, L.filter (위에는 진행 순서 보려고 디벼놓은 버전)
L.map = curry(function *(f, iter) {
  for (const a of iter) {
    yield f(a)
  }
})
L.filter = curry(function *(f, iter) {
  for (const a of iter) {
    if (f(a)) yield a
  }
})

/* L.flatten */
const isIterable = a => a && a[Symbol.iterator]

L.flatten = function *(iter) {
  for (const a of iter) {
    if (isIterable(a)) for (const b of a) yield b
    else yield a
  }
}

const it = L.flatten([1, 2], 3, 4, [5, 6])
it.next() // 1
it.next() // 2
it.next() // 3
log([...it]) // 1, 2, 3, 4, 5, 6

// 즉시 평가하는 flatten
const flatten = pipe(L.flatten, takeAll)

/* flatMap: flat과 map을 동시에 실행 */
// JS에 내장된 flatMap
// 비효율적으로 동작: 모든 배열을 만든 후 다시 배열을 만듦
// (시간 복잡도 측면에서는 동일함: 어차피 모든 원소를 순회해야 하므로)
[[1, 2], [3, 4], [5, 6, 7]].flatMap(a => a * a)

L.flatMap = curry(pipe(L.map, L.flatten))

const it2 = L.flatMap(map(a => a * a), [[1, 2], [3, 4], [5, 6, 7]])
it2.next() // 1
it2.next() // 4
it2.next() // 9

/**
 * 객체지향: 데이터 중심으로 메서드를 구성
 * 함수형: 메서드를 구성하고 데이터를 그에 맞게 맞춤
 */