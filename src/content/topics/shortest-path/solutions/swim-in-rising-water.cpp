class Solution {
public:
    int swimInWater(vector<vector<int>>& grid) {
        int n = grid.size();
        vector<vector<bool>> seen(n, vector<bool>(n, false));
        // min-heap of {time, r, c}
        priority_queue<array<int, 3>, vector<array<int, 3>>, greater<>> heap;
        heap.push({grid[0][0], 0, 0});
        seen[0][0] = true;
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        while (!heap.empty()) {
            auto [t, r, c] = heap.top();
            heap.pop();
            if (r == n - 1 && c == n - 1) return t;
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nc < 0 || nr >= n || nc >= n || seen[nr][nc]) continue;
                seen[nr][nc] = true;               // safe: cost only depends on the max so far
                heap.push({max(t, grid[nr][nc]), nr, nc});
            }
        }
        return -1;
    }
};
