/** 기존과 달라진 ES6에서의 순회 */
// Array
const arr = [1, 2, 3]
for (const el of arr) {
  log(el)
}

// Set
const set = new Set([1, 2, 3])
for (const el of set) {
  log(el)
}

// Map
const map = new Map([1, 2, 3])
for (const el of map) {
  log(el)
}

/** 이터러블/이터레이터 프로토콜 */
// ES6에서 추가된 심볼
// 어떤 객체의 key로 사용될 수 있다.
Symbol.iterator

// 이터러블: "이터레이터를 리턴하는 [Symbol.iterator]()"를 가진 값
arr[Symbol.iterator] // f values() { [native code] } ... (어떤 함수)
const iterator = arr[Symbol.iterator]()

// 이터레이터: "{ value, done } 객체를 리턴하는 next()"를 가진 값
iterator.next() // { value: 1, done: false }

// 이터러블/이터레이터 프로토콜: 이터러블을 for...of, 전개 연산자 등과 함께 동작하도록 한 규약

/** 사용자 정의 이터러블을 만들어보자 */
const iterable2 = {
  [Symbol.iterator]() {
    let i = 3
    return {
      next() {
        return i === 0 ? { done: true } : { value: i--, done: false }
      },
      [Symbol.iterator]() { return this }
    }
  }
}

// well-formed iterator(잘 만든 이터레이터)는 next()로 일부 진행한 후 다시 순회할 수 있다.
const iterator2 = iterable2[Symbol.iterator]()
iterator2.next() // { value: 3, done: false }
// well-formed iterator는 이터러블을 이터레이터로 만든 후 순회해도 잘 동작한다.
for (const el of iterator2) {
  log(el) // 2, 1
}
// well-formed iterator는 이터레이터가 자신을 반환하는 Symbol.iterator 메서드를 가지고 있다.
iterator2[Symbol.iterator] === iterator2 // true

// JavaScript 내장 객체 뿐만 아니라 여러 곳에서 이터러블/이터레이터를 구현하고 있다.
// - 오픈 소스 (예: Immutable)
// - Web API (예: document.querySelectorAll)

// + 전개 연산자 역시 이터러블/이터레이터 프로토콜을 따르는 객체를 순회하도록 되어있다.