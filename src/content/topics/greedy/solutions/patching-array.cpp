class Solution {
public:
    int minPatches(vector<int>& nums, int n) {
        long long miss = 1; // invariant: every value in [1, miss) is buildable; long long because it can pass 2^31
        int patches = 0;
        size_t i = 0;
        while (miss <= n) {
            if (i < nums.size() && nums[i] <= miss) {
                miss += nums[i]; // extend coverage to [1, miss + nums[i])
                i++;
            } else {
                miss += miss;    // patch with miss itself: coverage doubles
                patches++;
            }
        }
        return patches;
    }
};
