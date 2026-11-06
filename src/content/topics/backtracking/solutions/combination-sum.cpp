class Solution {
    vector<vector<int>> result;
    vector<int> path;

    void backtrack(const vector<int>& candidates, int start, int remaining) {
        if (remaining == 0) {
            result.push_back(path);
            return;
        }
        for (int i = start; i < (int)candidates.size(); i++) {
            if (candidates[i] > remaining) break;                // sorted: nothing later fits either
            path.push_back(candidates[i]);
            backtrack(candidates, i, remaining - candidates[i]); // i: the same number may be reused
            path.pop_back();
        }
    }

public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end()); // enables the early break
        backtrack(candidates, 0, target);
        return result;
    }
};
