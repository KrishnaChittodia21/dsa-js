class Solution {
public:
    bool checkSubarraySum(vector<int>& nums, int k) {
        unordered_map<int, int> firstIndex{{0, -1}}; // remainder -> earliest prefix index
        int rem = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            rem = (((long long)rem + nums[i]) % k + k) % k; // normalised remainder (long long: rem + x can pass 2^31)
            auto it = firstIndex.find(rem);
            if (it != firstIndex.end()) {
                if (i - it->second >= 2) return true; // subarray length >= 2
            } else {
                firstIndex[rem] = i;                  // never overwrite: keep the earliest
            }
        }
        return false;
    }
};
