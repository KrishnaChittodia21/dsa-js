// Fenwick Tree / Binary Indexed Tree: prefix sums with point updates, both O(log n).
// Internally 1-indexed. `i & -i` isolates the lowest set bit — the size of the range tree[i] covers.
export class FenwickTree {
  constructor(n) {
    this.n = n;
    this.tree = new Array(n + 1).fill(0);
  }
  static from(arr) {
    const ft = new FenwickTree(arr.length);
    arr.forEach((v, i) => ft.add(i, v));
    return ft;
  }
  // arr[index] += delta   (index is 0-based)
  add(index, delta) {
    for (let i = index + 1; i <= this.n; i += i & -i) this.tree[i] += delta;
  }
  // sum of arr[0..index]   (inclusive, 0-based)
  prefixSum(index) {
    let s = 0;
    for (let i = index + 1; i > 0; i -= i & -i) s += this.tree[i];
    return s;
  }
  // sum of arr[left..right]  (inclusive)
  rangeSum(left, right) {
    return this.prefixSum(right) - (left > 0 ? this.prefixSum(left - 1) : 0);
  }
}
