// Stack — Last In, First Out (LIFO).
// A JavaScript array already behaves like a stack (push/pop at the end are O(1)),
// this class just gives the operations clear names.
export class Stack {
  constructor() {
    this.items = [];
  }
  push(value) {
    this.items.push(value);
  }
  pop() {
    return this.items.pop(); // undefined when empty
  }
  peek() {
    return this.items[this.items.length - 1];
  }
  isEmpty() {
    return this.items.length === 0;
  }
  size() {
    return this.items.length;
  }
}
