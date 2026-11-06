class Solution {
public:
    int minimumEffortPath(vector<vector<int>>& heights) {
        int R = heights.size(), C = heights[0].size();
        vector<vector<int>> effort(R, vector<int>(C, INT_MAX));
        effort[0][0] = 0;
        // min-heap of {effort, r, c}
        priority_queue<array<int, 3>, vector<array<int, 3>>, greater<>> heap;
        heap.push({0, 0, 0});
        int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        while (!heap.empty()) {
            auto [e, r, c] = heap.top();
            heap.pop();
            if (r == R - 1 && c == C - 1) return e;  // popped = final
            if (e > effort[r][c]) continue;          // stale
            for (auto& d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
                int ne = max(e, abs(heights[nr][nc] - heights[r][c]));
                if (ne < effort[nr][nc]) {
                    effort[nr][nc] = ne;
                    heap.push({ne, nr, nc});
                }
            }
        }
        return 0;
    }
};
