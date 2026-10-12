// Union Find / Disjoint Set Union with path compression + union by rank.
// Both optimisations together make find/union effectively O(1) (inverse Ackermann).
export class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.componentSize = new Array(n).fill(1);
    this.count = n; // number of separate groups
  }
  find(x) {
    // Path compression: point every node on the way directly at the root.
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false; // already in the same group
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra; // attach the shorter tree under the taller one
    if (this.rank[ra] === this.rank[rb]) this.rank[ra]++;
    this.componentSize[ra] += this.componentSize[rb];
    this.count--;
    return true;
  }
  connected(a, b) {
    return this.find(a) === this.find(b);
  }
  sizeOf(x) {
    return this.componentSize[this.find(x)];
  }
}
