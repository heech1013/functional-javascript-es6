/* range */
const add = (a, b) => a + b

const range = l => {
  let i = -1
  const res = []
  while (++i < l) {
    log(i, 'range')
    res.push(i)
  }
  return res
}

// 아래 코드가 실행되는 순간 list는 배열이 됨(완전히 평가가 됨)
const list = range(5) // [0, 1, 2, 3, 4]
// 0, range
// 1, range
// 2, range
// 3, range
// 4, range
reduce(add, list) // 10

/* 느긋한 L.range */
const L = {}

// 이터러블을 생성하는 제너레이터 함수
L.range = function *(l) {
  log('hello world')
  let i = -1
  while (++i < l) {
    log(i, 'L.range')
    yield i
  }
}

// 차이점!
// 아래 코드가 실행되어도 generator 내부 코드는 실행되지 않음(평가되지 않음)
// 실제 필요한 순간에 코드를 실행하므로 더 효율적이다
const list2 = L.range(5) // 이터러블
// 아래 코드처럼 실제로 내부를 순회할 때 코드가 하나씩 동작함
// reduce(add, list2) // 10

list2.next()
// hello world
// 0, L.range
list2.next()
// 1, L.range

/* take */
const take = (l, iter) => {
  const res = []
  for (const a of iter) {
    res.push(a)
    if (res.length === l) return res
  }
  return res
}

// 비효율적: 만들어놓고 뽑음
take(5, range(100))
// 효율적: 뽑을 만큼만 만듦
take(5, L.range(100))
take(5, L.range(Infinity))

/* 지연 평가 */
// 이터러블 중심 프로그래밍에서의 지연 평가 (Lazy Evolution)
// - 제때 계산법
// - 느긋한 계산법
// - 제너레이터/이터레이터 프로토콜을 기반으로 구현

/* L.map */
L.map = function *(f, iter) {
  for (const a of iter) yield f(a)
}

const it = L.map(a => a + 10, [1, 2, 3])
it.next() // 10
it.next() // 20

/* L.filter */
L.filter = function *(f, iter) {
  for (const a of iter) if (f(a)) yield a
}

const it2 = L.filter(a => a % 2 === 0, [1, 2, 3])
it.next() // 1
it.next() // 3

/* range, map, filter, take, reduce 중첩 사용 */
go(range(10),
  map(n => n + 10),
  filter(n => n % 2),
  take(2),
  log)

/* L.range, L.map, L.filter, take, reduce 중첩 사용 */
go(L.range(10),
  L.map(n => n + 10),
  L.filter(n => n % 2),
  take(2),
  log)

// 일반 함수는 가로 방향으로 한번에, L은 세로 방향으로 하나씩 평가해나감
// 세로 방향으로 평가해도 결과가 같음
// [0, 1, 2, ...]
// [10, 11, 12, ...]
// [11, 13, ...]
// [11, 13]

/* map, filter 계열 함수들의 결합 법칙 */
// - 사용하는 데이터가 무엇이든지
// - 사용하는 보조 함수가 순수 함수라면 무엇이든지
// - 아래와 같이 결합한다면 둘 다 결과가 같다.

// [[mapping, mapping], [filtering, filtering], [something, something]]
// =
// [[mapping, filtering, something], [mapping, filtering, something]]