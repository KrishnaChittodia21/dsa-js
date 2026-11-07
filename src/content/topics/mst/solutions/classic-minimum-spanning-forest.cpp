struct UnionFind {
    vector<int> parent, rnk;
    int count;

    UnionFind(int n) : parent(n), rnk(n, 0), count(n) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];   // path halving
            x = parent[x];
        }
        return x;
    }

    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (rnk[ra] < rnk[rb]) swap(ra, rb);
        parent[rb] = ra;
        if (rnk[ra] == rnk[rb]) rnk[ra]++;
        count--;
        return true;
    }
};

class Solution {
public:
    vector<int> minSpanningForest(int n, vector<vector<int>>& edges) {
        vector<vector<int>> sorted = edges;
        sort(sorted.begin(), sorted.end(), [](auto& a, auto& b) { return a[2] < b[2]; });
        UnionFind uf(n);
        int total = 0;
        for (auto& e : sorted) {
            if (uf.unite(e[0], e[1])) total += e[2];   // joins two components → part of the forest
        }
        return {total, uf.count};                      // count = number of components left
    }
};
