// Sparse Table: O(n log n) preprocessing, O(1) range-min/max queries on a STATIC array.
// table[k][i] = min of arr[i .. i + 2^k - 1]. Any range is covered by two overlapping powers of two.
export class SparseTable {
  constructor(arr, combine = Math.min) {
    this.combine = combine;
    const n = arr.length;
    this.log = new Array(n + 1).fill(0);
    for (let i = 2; i <= n; i++) this.log[i] = this.log[i >> 1] + 1;
    this.table = [arr.slice()];
    for (let k = 1; 1 << k <= n; k++) {
      const prev = this.table[k - 1];
      const row = new Array(n - (1 << k) + 1);
      for (let i = 0; i < row.length; i++) row[i] = combine(prev[i], prev[i + (1 << (k - 1))]);
      this.table.push(row);
    }
  }
  // Inclusive range [left, right]. Works for idempotent operations (min, max, gcd).
  query(left, right) {
    const k = this.log[right - left + 1];
    return this.combine(this.table[k][left], this.table[k][right - (1 << k) + 1]);
  }
}
