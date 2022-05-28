/* L.map, map, take에 지연 평가 + Promise 적용하기 */
// 현재는 동기 상황에서만 잘 동작한다.
go([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)],
  L.map(a => a + 10),
  take(2),
  log) // ["[object Promise]10", "[object Promise]10"]

// 기존 L.map
L.map_before = curry(function *(f, iter) {
  for (const a of iter) {
    yield f(a)
  }
})

// 변경
// const go1 = (a, f) => a instanceof Promise ? a.then(f) : f(a)
L.map = curry(function *(f, iter) {
  for (const a of iter) {
    // go1 함수를 활용해 11이 될 예정인 값(Promise), 12가 될 예정인 값으로 만들어줄 수 있다.
    yield go1(a, f) // Promise {<resolved>: 11}, Promise {<resolved>: 12}
  }
})

// take 함수도 변경이 필요하다. (현재는 Promise를 받으면 그대로 Promise를 출력한다.)
// 기존 take
const take_before = curry((l, iter) => {
  const res = []
  let cur
  // (iterable을 받아 iterator를 만든다.)
  iter = iter[Symbol.iterator]()

  while (!(cur = iter.next()).done) {
    const a = cur.value
    res.push(a)
    
    if (res.length === l) return res
  }

  return res
})

// 변경
const take_1 = curry((l, iter) => {
  const res = []
  iter = iter[Symbol.iterator]()
  
  // 즉시 실행 함수 + 재귀 함수
  return function recur() {
    let cur
    
    while (!(cur = iter.next()).done) {
      const a = cur.value

      if (a instanceof Promise) return a.then(a => {
        res.push(a)
        return (res.length === l) ? res : recur()
      })

      res.push(a)
      if (res.length === l) return res
    }
    return res
  }()
})

go([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)],
  L.map(a => a + 10),
  take(2),
  log) // [11, 12]
// map은 L.map과 takeAll을 실행하는 함수이기 때문에, map을 써도 정상적으로 동작한다.
// const map = curry(pipe(L.map, takeAll))

/* L.filter, filter, take에 Kleisli Composition 적용하기 */
// filter에서 지연 평가 + Promise가 잘 동작하려면 Kleisli Composition을 활용해야 한다.
go([1, 2, 3, 4],
  L.map(a => Promise.resolve(a * a)),
  L.filter(a => a % 2),
  take(2),
  log) // [] (정상적으로 동작하지 않음)

// 기존 filter
L.filter_before = curry(function *(f, iter) {
  for (const a of iter) {
    if (f(a)) yield a
  }
})

// 변경
const nop = Symbol['nop']
// Symbol: 원시 데이터 형의 일종. 객체 프로퍼티에 대한 식별자로 사용된다.

L.filter_after = curry(function *(f, iter) {
  for (const a of iter) {
    // go1 활용
    const b = go1(a, f)

    if (b instanceof Promise) {
      // b가 true일 경우만 a를 yield한다.
      // b가 false인 경우는 해당 값을 다음 스텝으로 흘려보내지 않도록 처리해야 한다.
      // 이를 위해 Kleisli Composition의 개념을 활용해 Promise.reject()을 해준다.
      // -> 다음 함수로 전달되지 않게 된다. (이후의 함수 실행을 모두 취소한 것과 다름없게 만든다.)

      // (RECAP) Kleisli Composition: 오류가 발생할 수 있는 상황에서 안전하게 함수를 합성하기 위한 규칙
      // 함수 합성 f * g -> f(g(x)) 
      // g나 x에서 오류가 발생했을 때, f(g(x)) = g(x)
      // -> 엉뚱한 결과를 받아서 예상치 못한 값을 반환하지 않도록 한다.

      // 그냥 Promise.reject()를 하면, 이것이 (의도대로) 아무 일도 하지 않기를 바라는 reject인지,
      // 진짜 에러가 발생해서 실행된 reject인지 구분할 수 없게 된다.
      // 이를 위해 reject에 특정 값을 담아 전달해준다: (정하기 나름인데) nop으로 정한다.
      // nop이 오면 아무 일도 하지 않도록 처리해주면 된다.
      yield b.then(b => b ? a : Promise.reject(nop))
    } else if (b) {
      yield a
    }
  }
})

const take_2 = curry((l, iter) => {
  const res = []
  iter = iter[Symbol.iterator]()
  
  // 즉시 실행 함수 + 재귀 함수
  return function recur() {
    let cur
    
    while (!(cur = iter.next()).done) {
      const a = cur.value

      // filter로부터 Promise가 전달됨
      if (a instanceof Promise) {
        return a
          .then(a => {
            res.push(a)
            return (res.length === l) ? res : recur()
          })
          // nop일 경우 해당 값은 패스하고, 다음 값을 평가한다.
          // nop이 아닐 경우 해당 에러를 다시 reject으로 넘겨준다.
          .catch(e => (e === nop) ? recur() : Promise.reject(e))
      }

      res.push(a)
      if (res.length === l) return res
    }
    return res
  }()
})

go([1, 2, 3, 4],
  L.map(a => Promise.resolve(a * a)),
  L.filter(a => a % 2),
  // reject가 발생할 경우 바로 catch 문으로 이동하기 때문에, 
  // 아래에 아무리 많은 L.map이 있어도 모두 건너뛰고 take의 catch로 이동한다.
  L.map(/*...*/),
  L.map(/*...*/),
  L.map(/*...*/),
  take(2),
  log)

/* reduce에 지연 평가 + Promise 적용하기: nop 지원 */
go([1, 2, 3, 4],
  L.map(a => Promise.resolve(a * a)),
  L.filter(a => Promise.resolve(a % 2)),
  reduce(add),
  log) // 1[object Promise][object Promise][object Promise]

// 기존 reduce
const reduce_before = curry((f, acc, iter) => {
  if (!iter) {
    iter = acc[Symbol.iterator]()
    acc = iter.next().value
  } else {
    iter = iter[Symbol.iterator]()
  }
  // 첫 번째 값인 1 -> map과 filter를 거쳐 내려온 Promise는 go1로 인해 1로 변환되어 recur로 전달되지만,
  return go1(acc, function recur(acc) {
    let cur
    // iter.next()로 꺼내온 Promise는 go1를 통한 별도의 변환 없이 f로 전달되기 때문에, 정상 동작하지 않는다.
    while (!(cur = iter.next()).done) {
      const a = cur.value
      acc = f(acc, a)
      if (acc instanceof Promise) return acc.then(recur)
    }
    return acc
  })
})

// 변경
// (acc: reduce 함수 내에서 acc.then으로 Promise가 풀려 나오기 때문에 별도의 조치를 해줄 필요가 없다.)
const reduceF = (acc, a, f) => 
  a instanceof Promise ?
    // then의 두 번째 인자로 onRejected 함수를 전달함으로써 catch 에러 처리를 해줄 수도 있다.
    a.then(a => f(acc, a), e => (e === nop) ? acc : Promise.reject(e)) :
    f(acc, a)

// 리팩토링(코드를 간결하게 + 비동기 상황 대응)
// head: iterator를 만들어 head를 뽑고, 이후 reduce 로직을 진행하는 함수
const head = iter => go1(take(1, iter), ([h]) => h)

const reduce_after = curry((f, acc, iter) => {
  if (!iter) {
    return reduce(f, head(iter = acc[Symbol.iterator]()), iter)
  }

  iter = iter[Symbol.iterator]()
  return go1(acc, function recur(acc) {
    let cur
    while (!(cur = iter.next()).done) {
      // *
      acc = reduceF(acc, cur.value, f)
      if (acc instanceof Promise) return acc.then(recur)
    }
    return acc
  })
})

/* 지연 평가 + Promise의 효율성 */
// 시간이 오래 걸리는 비동기 작업이 일일이 실행되지 않고, 필요한 값만 평가하게 됨
go([1, 2, 3, 4, 5],
  L.map(a => new Promise(resolve => setTimeout(() => resolve(a * a), 1000))),
  L.filter(a => new Promise(resolve => setTimeout(() => resolve(a % 2), 1000))),
  take(2),
  log)

/* C.reduce, C.take: 지연된 함수열을 병렬적으로 평가하기 */
// JavaScript 실행 환경: 비동기 I/O
// CPU를 효율적으로 사용하기 위해, I/O 작업들을 (싱글 스레드인 JavaScript 환경에서도) 비동기로 처리하는 것.

// JavaScript에서의 병렬 처리
// (ex: Node.js 서버에서 DB에 쿼리를 병렬적으로 전송 등)
// JavaScript 실행 환경은 비동기 처리를 담당할 뿐,
// 어떤 동작들을 동시에 출발시켜 하나의 로직으로 귀결시키는 로직 등은 개발자가 다뤄야 한다.
// (물론 병렬성이 이나라 동시성으로 동작하는 병렬 처리이다: 실제로 병렬로 처리되는 것이 아니라, 병렬로 처리되는 것처럼 보이는 것)

const delay1000 = a => new Promise(resolve =>
  setTimeout(() => resolve(a), 1000))

// 현재는 지연 평가로 인해 (가로 방향이 아닌 세로 방향으로) 비동기 작업이 하나씩 실행되고 있다.
go([1, 2, 3, 4, 5],
  L.map(a => delay1000(a * a)),
  L.filter(a => a % 2),
  reduce(add),
  log)

C.reduce = curry((f, acc, iter) => iter ?
  // spread(...) 연산자로 다 실행을 시켜버린다.
  // 그 후 reduce를 실행해서, 다시 지연 평가(세로 방향)로 실행을 한다.
  reduce(f, acc, [...iter]) :
  reduce(f, [...acc]))

// 에러 출력 처리
go([1, 2, 3, 4, 5],
  L.map(a => delay1000(a * a)),
  L.filter(a => delay1000(a % 2)),
  L.map(a => delay1000(a * a)),
  reduce(add),
  log)
// 중간중간 Promise.reject로 인해 Uncaught (in promise) 에러가 출력된다.
// 이는 JavaScript의 특성 때문인데, 나중에 catch로 잡히는 것과는 별개로 그 순간 reject된 Promise에 대해서는 에러 log를 출력한다.
/* 
  const p = Promise.reject('에러') // 에러 log 출력
  p.catch(e => console.log('해결'))
*/

// -> 어차피 나중에 catch로 처리될 에러는 콜스택에서 출력할 필요는 없다는 것을 알려주자
function noop() {}
const catchNoop = arr =>
  (arr.forEach(a => a instanceof Promise ? a.catch(noop) : a), arr)

C.reduce = curry((f, acc, iter) => iter ? 
  // 미리 catch를 다 해놓자
  reduce(f, acc, catchNoop([...iter2])) :
  reduce(f, catchNoop([...iter2])))

// C.take
C.take = curry((l, iter) => take(l, catchNoop([...iter])))

/* C.map, C.filter: 즉시 병렬적으로 평가하기 */
// 기존 map, filter
const map = curry(pipe(L.map, takeAll))
const filter = curry(pipe(L.filter, takeAll))

// 선택적으로 원하는 곳에서만 병렬적으로 평가할 수 있도록 바꾼다.
C.takeAll = C.take(Infinity)
C.map = curry(pipe(L.map, C.takeAll))
C.filter = curry(pipe(L.filter, C.takeAll))

// 기존: 1초에 1개씩 평가
// 변경 후: 1초 뒤 동시에 [1, 4, 9, 16]으로 평가
C.map(a => delay1000(a * a), [1, 2, 3, 4]).then(log)

/* 즉시, 지연, Promise, 병렬적 조합하기 */