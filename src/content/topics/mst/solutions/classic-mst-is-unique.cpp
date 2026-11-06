struct UnionFind {
    vector<int> parent, rnk;

    UnionFind(int n) : parent(n), rnk(n, 0) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        while (parent[x] != x) x = parent[x] = parent[parent[x]];
        return x;
    }

    bool unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b) return false;
        if (rnk[a] < rnk[b]) swap(a, b);
        parent[b] = a;
        if (rnk[a] == rnk[b]) rnk[a]++;
        return true;
    }
};

class Solution {
public:
    bool isMstUnique(int n, vector<vector<int>>& edges) {
        vector<vector<int>> sorted = edges;
        sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) { return a[2] < b[2]; });
        UnionFind uf(n);
        int m = sorted.size(), i = 0;
        while (i < m) {
            int j = i;
            while (j < m && sorted[j][2] == sorted[i][2]) j++;  // group [i, j)

            // 1. how many edges of this weight are individually usable?
            int candidates = 0;
            for (int k = i; k < j; k++) {
                if (uf.find(sorted[k][0]) != uf.find(sorted[k][1])) candidates++;
            }
            // 2. how many can actually be used together?
            int merged = 0;
            for (int k = i; k < j; k++) {
                if (uf.unite(sorted[k][0], sorted[k][1])) merged++;
            }
            if (candidates > merged) return false;  // a choice existed
            i = j;
        }
        return true;
    }
};
