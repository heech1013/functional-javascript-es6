/** 제너레이터 / 이터레이터 */
// 제너레이터: 이터레이저이자, 이터러블을 생성하는 함수
function *generator() {
  yield 1
  if (false) yield 2
  yield 3

  // return 값은 순회 결과에 포함되지 않는다.
  return 100
}

const iterable = generator()
const iterator = iterable[Symbol.iterator]()
iterable.next() // { value: 1, done: false }
iterable.next() // { value: 3, done: false }
iterable.next() // { value: 100, done: true }

// 물론 순회도 가능하다
for (const el of iterable) {
  log(el) // 1, 3
}

// 제너레이터가 statement를 통해 값을 만들어낼 수 있다는 것은 함수형 프로그래밍에서 큰 의미를 가진다.
// 모든 것을 순회할 수 있는 이터러블로 만들 수 있다는 것이기 때문이다.