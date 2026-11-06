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
    int maxNumEdgesToRemove(int n, vector<vector<int>>& edges) {
        UnionFind alice(n + 1), bob(n + 1);          // nodes 1..n (slot 0 unused)
        int kept = 0;

        for (auto& e : edges) {                      // shared edges first
            if (e[0] != 3) continue;
            bool a = alice.unite(e[1], e[2]);
            bool b = bob.unite(e[1], e[2]);          // call both: no short-circuit!
            if (a || b) kept++;
        }
        for (auto& e : edges) {
            if (e[0] == 1 && alice.unite(e[1], e[2])) kept++;
            else if (e[0] == 2 && bob.unite(e[1], e[2])) kept++;
        }

        // count == 2 means {1..n} is one group plus the unused slot 0
        if (alice.count != 2 || bob.count != 2) return -1;
        return (int)edges.size() - kept;
    }
};
