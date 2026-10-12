// Queue — First In, First Out (FIFO).
// Array.shift() is O(n) because every remaining element moves one slot left.
// Instead we keep a `head` pointer and only move it forward: dequeue is O(1).
export class Queue {
  constructor(items = []) {
    this.items = [...items];
    this.head = 0;
  }
  enqueue(value) {
    this.items.push(value);
  }
  push(value) {
    this.enqueue(value);
  }
  dequeue() {
    if (this.isEmpty()) return undefined;
    const value = this.items[this.head++];
    // Occasionally compact so memory does not grow forever.
    if (this.head > 1024 && this.head * 2 >= this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return value;
  }
  shift() {
    return this.dequeue();
  }
  front() {
    return this.items[this.head];
  }
  isEmpty() {
    return this.size() === 0;
  }
  size() {
    return this.items.length - this.head;
  }
  get length() {
    return this.size();
  }
}
