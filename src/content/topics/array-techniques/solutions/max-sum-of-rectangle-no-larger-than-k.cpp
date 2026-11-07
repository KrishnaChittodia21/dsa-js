class Solution {
public:
    int maxSumSubmatrix(vector<vector<int>>& matrix, int k) {
        int rows = matrix.size(), cols = matrix[0].size();
        int best = INT_MIN;

        for (int top = 0; top < rows; top++) {
            vector<int> colSum(cols, 0);
            for (int bottom = top; bottom < rows; bottom++) {
                for (int c = 0; c < cols; c++) colSum[c] += matrix[bottom][c];

                // Shortcut: unbounded best via Kadane. If it already fits under k, it is optimal.
                int cur = colSum[0], kad = colSum[0];
                for (int c = 1; c < cols; c++) {
                    cur = max(colSum[c], cur + colSum[c]);
                    kad = max(kad, cur);
                }
                if (kad <= k) { best = max(best, kad); continue; }

                // Otherwise: best P[r] - P[l] <= k  <=>  smallest earlier prefix P[l] >= P[r] - k.
                set<int> sorted = {0}; // prefixes seen so far
                int prefix = 0;
                for (int c = 0; c < cols; c++) {
                    prefix += colSum[c];
                    auto it = sorted.lower_bound(prefix - k);
                    if (it != sorted.end()) best = max(best, prefix - *it);
                    sorted.insert(prefix);
                }
                if (best == k) return k; // cannot do better than k
            }
        }
        return best;
    }
};
