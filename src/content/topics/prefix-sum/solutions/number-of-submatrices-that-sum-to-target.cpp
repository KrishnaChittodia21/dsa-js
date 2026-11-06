class Solution {
public:
    int numSubmatrixSumTarget(vector<vector<int>>& matrix, int target) {
        int m = matrix.size(), n = matrix[0].size();
        int total = 0;
        for (int top = 0; top < m; top++) {
            vector<int> colSum(n, 0);
            for (int bottom = top; bottom < m; bottom++) {
                for (int c = 0; c < n; c++) colSum[c] += matrix[bottom][c]; // squash rows top..bottom

                // Count subarrays of colSum with sum == target (Subarray Sum Equals K).
                unordered_map<int, int> seen{{0, 1}};
                int cur = 0;
                for (int c = 0; c < n; c++) {
                    cur += colSum[c];
                    auto it = seen.find(cur - target);
                    if (it != seen.end()) total += it->second;
                    seen[cur]++;
                }
            }
        }
        return total;
    }
};
