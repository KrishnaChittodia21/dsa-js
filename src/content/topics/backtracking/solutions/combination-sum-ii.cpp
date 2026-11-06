class Solution {
    vector<vector<int>> result;
    vector<int> path;

    void backtrack(const vector<int>& candidates, int start, int remaining) {
        if (remaining == 0) {
            result.push_back(path);
            return;
        }
        for (int i = start; i < (int)candidates.size(); i++) {
            if (i > start && candidates[i] == candidates[i - 1]) continue; // duplicate sibling
            if (candidates[i] > remaining) break;                          // sorted: stop
            path.push_back(candidates[i]);
            backtrack(candidates, i + 1, remaining - candidates[i]);       // each index once
            path.pop_back();
        }
    }

public:
    vector<vector<int>> combinationSum2(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());
        backtrack(candidates, 0, target);
        return result;
    }
};
