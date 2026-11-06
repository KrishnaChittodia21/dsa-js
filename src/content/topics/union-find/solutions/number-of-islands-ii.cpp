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
    vector<int> numIslands2(int m, int n, vector<vector<int>>& positions) {
        UnionFind uf(m * n);
        vector<char> land(m * n, 0);
        const int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        vector<int> answer;
        int islands = 0;

        for (auto& p : positions) {
            int r = p[0], c = p[1];
            int id = r * n + c;
            if (!land[id]) {
                land[id] = 1;
                islands++; // a brand-new island of size 1
                for (auto& d : dirs) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                    int nb = nr * n + nc;
                    if (land[nb] && uf.unite(id, nb)) islands--; // merged two islands
                }
            }
            answer.push_back(islands);
        }
        return answer;
    }
};
