/* 콜백 패턴과 Promise */
// 콜백 패턴
function add10(a, callback) {
  setTimeout(() => callback(a + 10), 1000)
}

add10(5, res => {
  console.log(res) // 15
})

// 콜백 패턴의 연속된 사용
// 사용하기 불편하고, 보기 좋지 않다.
add10(5, res => {
  add10(res, res => {
    add10(res, res => {
      console.log(res)
    })
  })
})

// Promise
function add20(a) {
  return new Promise(resolve => setTimeout(() => resolve(a + 20), 1000))
}

add20(5)
  .then(console.log) // 25
  
// Promise의 연속된 사용
add20(5)
  .then(add20)
  .then(add20)
  .then(console.log) // 65

/* Promise가 callback 패턴과 다른 점 */
// 차이점이 then으로 결과값을 쉽게 꺼내볼 수 있다는 점에 초점이 맞춰지는 경향이 있다.
// 그러나 가장 큰 차이점은 비동기 상황을 1급 값으로 다룬다는 점이다.

// ***
// Promise는 Promise라는 class를 통해 만들어진 인스턴스를 반환하는데, 그 Promise는 대기, 성공, 실패를 다루는 1급 값이다.
// (대기, 성공, 실패가 코드나 컨텍스트로만 다뤄지는 것이 아니라, '대기되고 있다'라는 1급 값을 만든다는 것)

// 콜백 패턴은 비동기 상황이 코드나 컨텍스트로만 남아있고, 이후 해당 비동기 상황을 통해 어떤 추가 작업을 하기 위해서는
// 내부의 코드, 컨텍스트 안에서만 해야한다.
// 반면, Promise는 비동기 상황을 1급 값으로 반환하므로 해당 값을 활용해 추가적인 작업을 이어나갈 수 있다.

/* 1급 값(인 비동기 상황)의 활용 */
const delay100 = a => new Promise(resolve => 
  setTimeout(() => resolve(a), 100))

// go1은 a와 f가 동기적인 값임을 전제로 한다.
const go1 = (a, f) => f(a)
const add5 = a => a + 5

go1(10, add5) // 15

// 만약 a나 f가 비동기적으로 값을 반환한다면, 제대로 결과값을 받을 수 없다.
go1(delay100(10), add5) // [object Promise]5

// go1을 Promise가 들어와도 잘 동작하도록 바꿔보자
const go2 = (a, f) => a instanceof Promise ? a.then(f) : f(a)

// 정상 동작
const r2 = go2(delay100(10), add5)
r2.then(console.log) // 15

// 이렇게 작성하면 위아래 코드가 완전 동일한 형태가 됨
const n1 = 10
go1(go1(n1, add5), console.log)
const n2 = delay100(10)
go1(go1(n2, add5), console.log)

/* 함수 합성(Composition) 관점에서의 Promise */
// Promise는 비동기 상황에서 함수 합성을 안전하게 하기 위한 도구(: "모나드")로 볼 수 있다.

// 함수 합성
// f . g -> f(g(x))
const g = a => a + 1
const f = a => a * a

console.log(f(g(1))) // 4
console.log(f(g())) // NaN
// 안전하지 않은 합성: console.log의 인자로 전달되지 않았으면 하는 값(NaN)이 전달됨.
// 값이 있을지 없을지, 안전할지 안전하지 않을지 모르는 상황에서 함수 합성을 어떻게 안전하게 할 수 있을까?

// 모나드: 컨테이너 안에 (함수 합성에 필요한) 값이 들어있는 형태
// (모나드의 개념이 무엇인지에 대해 너무 신경쓰진 않아도 됨)
[1]

// 안전한 함수 합성은 이런 식으로 이루어진다.
([1]).map(g).map(f).forEach(console.log) // 4
([]).map(g).map(f).forEach(console.log) // (아무것도 출력되지 않음)
// Array의 성질: 프로그래머가 어떤 결과를 얻기 위해 사용하는 수단이지, 실제로 결과값에 포함되는 값은 아니다.

// Promise는?
Array.of(1).map(g).map(f).forEach(console.log) // 4
Promise.resolve(1).then(g).then(f).then(r => console.log(r)) // 4
Promise.resolve().then(g).then(f).then(r => console.log(r)) // NaN
// Array와 Promise의 안전한 함수 합성의 컨셉이 다름.
// Promise는 값이 있냐 없냐에 따른 안전한 함수 합성에 사용되는 것이 아니라,
// 비동기 상황에서 안전한 함수 합성을 위해 사용된다.
new Promise(resolve => 
  setTimeout(() => resolve(2), 100)
).then(g).then(f).then(r =>  log(r))

/* Kleisli Composition 관점에서의 Promise */
// Kleisli Composition(Kleisli Arrow): 오류가 있을 수 있는 상황에서 안전하게 함수를 합성하는 하나의 규칙
// 현대 프로그래밍에서는 외부 요소와의 연결, 효과로부터 분리될 수 없음 -> 정말 순수한 함수형 프로그래밍을 하기 힘들다.

// f(g(x)) = f(g(x)) 
// g가 어떤 외부 요소로 인해 달라진다면(g에서 에러가 발생한다면), 위 식은 성립되지 않을 수 있음.

// Kleisli Composition은 g, 혹은 x에서 에러가 발생했을 때, 아래 식이 성립하게끔 하는 것이다.
// f(g(x)) = g(x)

const users = [
  { id: 1, name: 'a' },
  { id: 2, name: 'b' },
  { id: 3, name: 'c' },
]

const getUserById = id =>
  find(u => u.id === id, users)

const f2 = ({ name }) => (name)
const g2 = getUserById

const fg2 = id => f(g(id))

fg2(2) // 'b'

// 에러가 발생하는 상황
const r3 = fg(2)
users.pop()
users.pop()
const r4 = fg(2) // Error!

// Promise로 Kleisli Composition
const getUserById2 = id =>
  find(u => u.id === id, users) || Promise.reject('없어요!')
const g3 = getUserById2

const fg3 = id => Promise.resolve(id).then(g3).then(f)

users.pop()
users.pop()
g3(2) // Promise{<rejected>: "없어요!"}
fg3(2) // Promise{<rejected>: "없어요!"}
// f(g(x)) = g(x)
// 엉뚱한 결과를 받아들이지도 않고, 엉뚱한 로그를 출력하지도 않는다.

const fg4 = id => Promise.resolve(id).then(g3).then(f).catch(a => a)
users.pop()
users.pop()
fg3(2) // "없어요!"

/* go, pipe, reduce에서의 비동기 제어 */
go(1,
  a => a + 10,
  a => Promise.resolve(a + 100),
  a => a + 1000,
  a => a + 10000,
  log) // 이상한 값

// 기존 reduce 함수를 수정
export const reduce = curry((f, acc, iter) => {
  if (!iter) {
    iter = acc[Symbol.iterator]()
    acc = iter.next().value
  } else {
    iter = iter[Symbol.iterator]()
  }
  // const go1 = (a, f) => a instanceof Promise ? a.then(f) : f(a)
  return go1(acc, function recur(acc) {
    let cur
    while (!(cur = iter.next()).done) {
      const a = cur.value
      acc = f(acc, a)
      if (acc instanceof Promise) return acc.then(recur)
    }
    return acc
  })
})

go(1,
  a => a + 10,
  a => Promise.reject('error~'),
  // 아래 함수들은 실행되지 않는다.
  a => a + 1000,
  a => a + 10000,
  log).catch(a => console.log(a)) // error~

/* Promise.then의 중요한 규칙 */
// Promise가 아무리 중첩되어 있어도 then을 통해 결과값을 꺼내쓸 수 있다.
Promise.resolve(Promise.resolve(1)).then(function (a) {
  log(a) // 1
})