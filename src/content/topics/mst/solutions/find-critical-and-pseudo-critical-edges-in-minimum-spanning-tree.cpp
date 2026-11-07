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
    vector<vector<int>> findCriticalAndPseudoCriticalEdges(int n, vector<vector<int>>& edges) {
        // keep original indices, then sort by weight once
        vector<array<int, 4>> sorted;
        for (int i = 0; i < (int)edges.size(); i++) sorted.push_back({edges[i][0], edges[i][1], edges[i][2], i});
        sort(sorted.begin(), sorted.end(), [](auto& a, auto& b) { return a[2] < b[2]; });

        // MST weight with edge 'skip' banned and edge 'force' pre-added (original indices)
        auto mst = [&](int skip, int force) {
            UnionFind uf(n);
            int total = 0;
            if (force != -1) {
                uf.unite(edges[force][0], edges[force][1]);
                total += edges[force][2];
            }
            for (auto& [a, b, w, idx] : sorted) {
                if (idx == skip || idx == force) continue;
                if (uf.unite(a, b)) total += w;
            }
            return uf.count == 1 ? total : INT_MAX;   // disconnected → impossible
        };

        int best = mst(-1, -1);
        vector<int> critical, pseudo;
        for (int i = 0; i < (int)edges.size(); i++) {
            if (mst(i, -1) > best) critical.push_back(i);        // cannot live without it
            else if (mst(-1, i) == best) pseudo.push_back(i);    // can be in some MST
        }
        return {critical, pseudo};
    }
};
