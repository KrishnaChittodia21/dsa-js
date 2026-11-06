class Solution {
    vector<vector<int>> result;
    vector<int> path;
    vector<bool> used;

    void backtrack(const vector<int>& nums) {
        if (path.size() == nums.size()) { // every position filled
            result.push_back(path);
            return;
        }
        for (int i = 0; i < (int)nums.size(); i++) {
            if (used[i]) continue;        // already in this permutation
            used[i] = true;               // choose
            path.push_back(nums[i]);
            backtrack(nums);              // explore
            path.pop_back();              // undo BOTH pieces of state
            used[i] = false;
        }
    }

public:
    vector<vector<int>> permute(vector<int>& nums) {
        used.assign(nums.size(), false);
        backtrack(nums);
        return result;
    }
};
