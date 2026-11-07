class Solution {
    vector<vector<int>> result;
    vector<int> path;

    void backtrack(int n, int k, int start) {
        if ((int)path.size() == k) {
            result.push_back(path);
            return;
        }
        int need = k - path.size();
        // x can go no further than n - need + 1, otherwise too few numbers remain
        for (int x = start; x <= n - need + 1; x++) {
            path.push_back(x);
            backtrack(n, k, x + 1);
            path.pop_back();
        }
    }

public:
    vector<vector<int>> combine(int n, int k) {
        backtrack(n, k, 1);
        return result;
    }
};
