/* 이터러블 프로토콜을 따르는 고차 함수 map */
const map = (f, iter) => {
  let res = []
  for (const el of iter) {
    res.push(f(el))
  }
  return res
}

const products = [{ name: '반팔티', price: 15000 }, { name: '후드티', price: 30000 }]
map(p => p.name, products)

/* map의 다형성 */
// document.querySelectorAll은 map이라는 함수를 가지고 있지 않다.
// Array를 상속하지 않고 있기 때문이다.
document.querySelectorAll('*').map // error: no function

// 우리의 map은 잘 동작한다.
map(el => el.nodeName, document.querySelectorAll('*'))
// document.querySelectorAll이 이터러블 프로토콜을 따르고 있기 때문이다.
const iterator = document.querySelectorAll('*')[Symbol.iterator]()

// 이터러블 프로토콜을 따르는 모든 것에 사용할 수 있기 때문에 다형성이 높다.
// 다른 여러 helper 함수와의 조합이 좋다는 이야기이기도 하다.

// generator에 활용
function *gen() {
  yield 2;
  if (false) yield 3;
  yield 4;
}
map(el => el * el, gen())

// Map에 활용
const m = new Map()
m.set('a', 10)
m.set('b', 20)
// 새로운 Map 생성
new Map(map(([key, value]) => [key, value * 2], m))

/* filter */
const filter = (f, iter) => {
  const res = []
  for (const el of iter) {
    if (f(el)) res.push(el)
  }
  return res
}

filter(p => p.price >= 20000, products)

/* reduce(하나의 값으로 출력하는 함수) */
const reduce = (f, acc, iter) => {
  // 초기값을 전달해주지 않아도 잘 동작하도록
  if (!iter) {
    iter = acc[Symbol.iterator]()
    acc = iter.next().value
  }
  for (const el of iter) {
    acc = f(acc, el)
  }
  return acc
}

const add = (a, b) => a + b
reduce(add, 0, [1, 2, 3, 4, 5]) // 15
reduce(add, [1, 2, 3, 4, 5]) // 15

/* map, filter, reduce 중첩 사용과 함수형 사고 */
// 읽을 때는 오른쪽 끝에서부터 왼쪽으로 읽어나간다.
// 코드를 작성할 때는 왼쪽에서부터 오른쪽으로 점진적으로 작성해나간다.
log( // (5) 그 값을 로깅한다.
  reduce( // (4) 하나의 값으로 만든다.
    add, // (3) filter한 값을 더해서-
    filter(n => n <= 20000, // (2) map한 값을 20000 이하만 filter한다.
      map(p => p.price, products)))) // (1) products를 price로 map한다.