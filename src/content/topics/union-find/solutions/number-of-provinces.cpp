struct UnionFind {
    vector<int> parent, size;
    int count;

    UnionFind(int n) : parent(n), size(n, 1), count(n) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]]; // path halving
            x = parent[x];
        }
        return x;
    }

    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) swap(ra, rb);
        parent[rb] = ra; // union by size
        size[ra] += size[rb];
        count--;
        return true;
    }
};

class Solution {
public:
    int findCircleNum(vector<vector<int>>& isConnected) {
        int n = isConnected.size();
        UnionFind uf(n); // count starts at n
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) { // symmetric: upper triangle is enough
                if (isConnected[i][j] == 1) uf.unite(i, j);
            }
        }
        return uf.count;
    }
};
