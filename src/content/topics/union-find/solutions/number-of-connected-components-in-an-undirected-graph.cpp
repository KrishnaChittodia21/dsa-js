class Solution {
public:
    int countComponents(int n, vector<vector<int>>& edges) {
        vector<int> parent(n), size(n, 1);
        iota(parent.begin(), parent.end(), 0);
        int components = n;
        for (auto& e : edges) {
            int ra = find(parent, e[0]), rb = find(parent, e[1]);
            if (ra == rb) continue; // already connected
            if (size[ra] < size[rb]) swap(ra, rb);
            parent[rb] = ra; // union by size
            size[ra] += size[rb];
            components--;
        }
        return components;
    }

private:
    int find(vector<int>& parent, int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]]; // path halving
            x = parent[x];
        }
        return x;
    }
};
