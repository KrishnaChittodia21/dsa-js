struct UnionFind {
    vector<int> parent, sz;
    int count;

    UnionFind(int n) : parent(n), sz(n, 1), count(n) {
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
        if (sz[ra] < sz[rb]) swap(ra, rb);
        parent[rb] = ra;
        sz[ra] += sz[rb];
        count--;
        return true;
    }

    bool connected(int a, int b) {
        return find(a) == find(b);
    }
};

class Solution {
public:
    string smallestStringWithSwaps(string s, vector<vector<int>>& pairs) {
        int n = s.size();
        UnionFind uf(n);
        for (auto& p : pairs) uf.unite(p[0], p[1]);

        unordered_map<int, vector<int>> groups;      // root -> indices (increasing)
        for (int i = 0; i < n; i++) groups[uf.find(i)].push_back(i);

        string out = s;
        for (auto& [root, idx] : groups) {
            string chars;
            for (int i : idx) chars += s[i];
            sort(chars.begin(), chars.end());
            for (int k = 0; k < (int)idx.size(); k++) out[idx[k]] = chars[k];
        }
        return out;
    }
};
