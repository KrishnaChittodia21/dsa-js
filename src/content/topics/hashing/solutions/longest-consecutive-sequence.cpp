class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        unordered_set<long long> set(nums.begin(), nums.end());
        int best = 0;
        for (long long x : set) {
            if (set.count(x - 1)) continue;      // not the start of a run
            long long y = x;
            while (set.count(y + 1)) y++;        // walk the run
            best = max(best, (int) (y - x + 1));
        }
        return best;
    }
};
