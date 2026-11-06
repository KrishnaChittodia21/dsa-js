class Solution {
public:
    bool containsNearbyDuplicate(vector<int>& nums, int k) {
        unordered_set<int> window; // values at indices i-k .. i-1
        for (int i = 0; i < (int) nums.size(); i++) {
            if (window.count(nums[i])) return true;
            window.insert(nums[i]);
            if (i >= k) window.erase(nums[i - k]); // keep at most k values
        }
        return false;
    }
};
