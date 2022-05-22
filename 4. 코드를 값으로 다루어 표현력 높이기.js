/* 코드를 값으로 다루어 표현력 높이기 */
// 기존: 읽기 불편하다
log(
  reduce(
    add,
    filter(n => n <= 20000,
      map(p => p.price, products))))

// go: 여러 함수를 받아 하나의 값을 리턴하는 함수
// 즉시 어떤 값을 평가하는 데 사용
const go = (...args) => reduce((a, f) => f(a), args)
go(
  add(0, 1),
  el => el + 1,
  el => el + 10,
  el => el + 100,
  log) // 111

// pipe: 여러 함수를 받아 하나의 함수를 리턴하는 함수
// 인자로 받는 첫 함수는 2개 이상의 인자를 받을 수 있도록 한다.
const pipe = (f, ...fs) => (...els) => go(f(...els), ...fs)
const f = pipe(
  (a, b) => a + b,
  el => el + 10,
  el => el + 100)
log(f(0, 1)) // 111

// 조금 장황해졌지만, 조금 더 쉽게(위에서부터 아래로) 읽을 수 있도록 개선되었다.
go(
  products,
  products => filter(p => p.price <= 20000, products),
  products => map(p => p.price, products),
  prices => reduce(add, prices),
  log)

// curry
// 함수를 리턴
// 해당 함수의 인자가 2개 이상이라면 받아둔 함수를 즉시 실행
// 인자가 2개 미만이라면 함수를 리턴: 그 함수는 이후에 받은 인자들을 합쳐서 실행
const curry = f => 
  (el, ..._) => _.length ? f(el, ..._) : (..._) => f(el, ..._)

const mult = curry((a, b) => a * b)
mult() // (el, ..._) => _.length ? f(el, ..._) : (..._) => f(el, ..._)
mult(1) // (..._) => f(el, ..._)
mult(1)(2) // 2

// 사용 패턴
const mult3 = mult(3)
mult3(3) // 9
mult3(5) // 15
mult3(10) // 30

// map, filter, reduce에 curry 적용
// 인자를 하나만 받으면 이후 인자를 더 받을 때까지 기다리는 함수가 된다.
const map = curry((f, iter) => {
  let res = []
  for (const el of iter) {
    res.push(f(el))
  }
  return res
})
const filter = curry((f, iter) => {
  const res = []
  for (const el of iter) {
    if (f(el)) res.push(el)
  }
  return res
})
const reduce = curry((f, acc, iter) => {
  if (!iter) {
    iter = acc[Symbol.iterator]()
    acc = iter.next().value
  }
  for (const el of iter) {
    acc = f(acc, el)
  }
  return acc
})

// curry 적용
go(
  products,
  products => filter(p => p.price <= 20000)(products),
  products => map(p => p.price)(products),
  prices => reduce(add)(prices),
  log)
  
// 위 코드는 아래와 같다!
go(
  products,
  filter(p => p.price <= 20000),
  map(p => p.price),
  reduce(add),
  log)

/* 함수 조합으로 함수 만들기 */
// 아래와 같이 다른 일을 하지만 중복이 많은 코드가 있다.
go(
  products,
  filter(p => p.price < 20000),
  map(p => p.price), // 중복
  reduce(add), // 중복
  log)

go(
  products,
  filter(p => p.price >= 20000),
  map(p => p.price), // 중복
  reduce(add), // 중복
  log)

// pipe로 함수 조합
const totalPrice = pipe(
  map(p => p.price),
  reduce(add))

go(
  products,
  filter(p => p.price < 20000),
  totalPrice,
  log)

go(
  products,
  filter(p => p.price >= 20000),
  totalPrice,
  log)

// 더 개선
const baseTotalPrice = predi => pipe(
  filter(predi),
  totalPrice)

go(
  products,
  baseTotalPrice(p => p.price < 20000),
  log)

go(
  products,
  baseTotalPrice(p => p.price >= 20000),
  log)