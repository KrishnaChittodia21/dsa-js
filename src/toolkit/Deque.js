// Deque — double-ended queue: O(1) add/remove at BOTH ends.
// Implemented as a circular buffer that doubles when full.
export class Deque {
  constructor(capacity = 16) {
    this.buf = new Array(capacity);
    this.head = 0; // index of the front element
    this.count = 0;
  }
  #grow() {
    const next = new Array(this.buf.length * 2);
    for (let i = 0; i < this.count; i++) next[i] = this.buf[(this.head + i) % this.buf.length];
    this.buf = next;
    this.head = 0;
  }
  pushBack(value) {
    if (this.count === this.buf.length) this.#grow();
    this.buf[(this.head + this.count) % this.buf.length] = value;
    this.count++;
  }
  pushFront(value) {
    if (this.count === this.buf.length) this.#grow();
    this.head = (this.head - 1 + this.buf.length) % this.buf.length;
    this.buf[this.head] = value;
    this.count++;
  }
  popFront() {
    if (this.count === 0) return undefined;
    const value = this.buf[this.head];
    this.buf[this.head] = undefined;
    this.head = (this.head + 1) % this.buf.length;
    this.count--;
    return value;
  }
  popBack() {
    if (this.count === 0) return undefined;
    const idx = (this.head + this.count - 1) % this.buf.length;
    const value = this.buf[idx];
    this.buf[idx] = undefined;
    this.count--;
    return value;
  }
  front() {
    return this.count ? this.buf[this.head] : undefined;
  }
  back() {
    return this.count ? this.buf[(this.head + this.count - 1) % this.buf.length] : undefined;
  }
  get(i) {
    return i >= 0 && i < this.count ? this.buf[(this.head + i) % this.buf.length] : undefined;
  }
  isEmpty() {
    return this.count === 0;
  }
  size() {
    return this.count;
  }
  toArray() {
    const out = [];
    for (let i = 0; i < this.count; i++) out.push(this.get(i));
    return out;
  }
}
