// Binary Heap stored in an array.
// For the node at index i:  parent = (i - 1) >> 1,  children = 2i + 1 and 2i + 2.
// The comparator decides priority: compare(a, b) < 0 means `a` should come out first.
export class PriorityQueue {
  constructor(compare = (a, b) => a - b) {
    this.heap = [];
    this.compare = compare;
  }
  size() {
    return this.heap.length;
  }
  isEmpty() {
    return this.heap.length === 0;
  }
  peek() {
    return this.heap[0];
  }
  push(value) {
    this.heap.push(value);
    this.#siftUp(this.heap.length - 1);
  }
  pop() {
    const h = this.heap;
    if (h.length === 0) return undefined;
    const top = h[0];
    const last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      this.#siftDown(0);
    }
    return top;
  }
  toArray() {
    return [...this.heap];
  }
  #siftUp(i) {
    const h = this.heap;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(h[i], h[parent]) >= 0) break;
      [h[i], h[parent]] = [h[parent], h[i]];
      i = parent;
    }
  }
  #siftDown(i) {
    const h = this.heap;
    const n = h.length;
    while (true) {
      const left = 2 * i + 1;
      const right = left + 1;
      let best = i;
      if (left < n && this.compare(h[left], h[best]) < 0) best = left;
      if (right < n && this.compare(h[right], h[best]) < 0) best = right;
      if (best === i) break;
      [h[i], h[best]] = [h[best], h[i]];
      i = best;
    }
  }
}

// Smallest value on top. Pass a key function to order objects: new MinHeap(x => x.dist)
export class MinHeap extends PriorityQueue {
  constructor(key = (x) => x) {
    super((a, b) => key(a) - key(b));
  }
}

// Largest value on top.
export class MaxHeap extends PriorityQueue {
  constructor(key = (x) => x) {
    super((a, b) => key(b) - key(a));
  }
}
