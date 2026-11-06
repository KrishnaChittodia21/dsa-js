class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        unordered_map<int, int> seen{{0, 1}}; // prefix value -> how many times seen; empty prefix once
        int cur = 0, count = 0;
        for (int x : nums) {
            cur += x;
            auto it = seen.find(cur - k);     // starts that make a sum-k subarray ending here
            if (it != seen.end()) count += it->second;
            seen[cur]++;                      // record AFTER the lookup
        }
        return count;
    }
};
