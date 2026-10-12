// Segment Tree over an array: point update + range query in O(log n).
// `combine` must be associative (sum, min, max, gcd...). `identity` is its neutral value.
export class SegmentTree {
  constructor(arr, combine = (a, b) => a + b, identity = 0) {
    this.n = arr.length;
    this.combine = combine;
    this.identity = identity;
    this.tree = new Array(2 * this.n).fill(identity);
    // Iterative (bottom-up) layout: leaves live at [n, 2n).
    for (let i = 0; i < this.n; i++) this.tree[this.n + i] = arr[i];
    for (let i = this.n - 1; i > 0; i--) this.tree[i] = combine(this.tree[2 * i], this.tree[2 * i + 1]);
  }
  update(index, value) {
    let i = index + this.n;
    this.tree[i] = value;
    for (i >>= 1; i >= 1; i >>= 1) this.tree[i] = this.combine(this.tree[2 * i], this.tree[2 * i + 1]);
  }
  // Inclusive range [left, right].
  query(left, right) {
    let resLeft = this.identity;
    let resRight = this.identity;
    let l = left + this.n;
    let r = right + this.n + 1;
    while (l < r) {
      if (l & 1) resLeft = this.combine(resLeft, this.tree[l++]);
      if (r & 1) resRight = this.combine(this.tree[--r], resRight);
      l >>= 1;
      r >>= 1;
    }
    return this.combine(resLeft, resRight);
  }
}

// Segment tree with lazy propagation: range add + range sum, both O(log n).
export class LazySegmentTree {
  constructor(arr) {
    this.n = arr.length;
    this.sum = new Array(4 * this.n).fill(0);
    this.lazy = new Array(4 * this.n).fill(0);
    if (this.n) this.#build(arr, 1, 0, this.n - 1);
  }
  #build(arr, node, lo, hi) {
    if (lo === hi) {
      this.sum[node] = arr[lo];
      return;
    }
    const mid = (lo + hi) >> 1;
    this.#build(arr, 2 * node, lo, mid);
    this.#build(arr, 2 * node + 1, mid + 1, hi);
    this.sum[node] = this.sum[2 * node] + this.sum[2 * node + 1];
  }
  #push(node, lo, hi) {
    if (this.lazy[node] !== 0) {
      const mid = (lo + hi) >> 1;
      this.#apply(2 * node, lo, mid, this.lazy[node]);
      this.#apply(2 * node + 1, mid + 1, hi, this.lazy[node]);
      this.lazy[node] = 0;
    }
  }
  #apply(node, lo, hi, delta) {
    this.sum[node] += delta * (hi - lo + 1);
    this.lazy[node] += delta;
  }
  rangeAdd(l, r, delta, node = 1, lo = 0, hi = this.n - 1) {
    if (r < lo || hi < l) return;
    if (l <= lo && hi <= r) {
      this.#apply(node, lo, hi, delta);
      return;
    }
    this.#push(node, lo, hi);
    const mid = (lo + hi) >> 1;
    this.rangeAdd(l, r, delta, 2 * node, lo, mid);
    this.rangeAdd(l, r, delta, 2 * node + 1, mid + 1, hi);
    this.sum[node] = this.sum[2 * node] + this.sum[2 * node + 1];
  }
  rangeSum(l, r, node = 1, lo = 0, hi = this.n - 1) {
    if (r < lo || hi < l) return 0;
    if (l <= lo && hi <= r) return this.sum[node];
    this.#push(node, lo, hi);
    const mid = (lo + hi) >> 1;
    return this.rangeSum(l, r, 2 * node, lo, mid) + this.rangeSum(l, r, 2 * node + 1, mid + 1, hi);
  }
}
