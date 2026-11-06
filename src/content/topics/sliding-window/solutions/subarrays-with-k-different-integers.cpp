class Solution {
public:
    int subarraysWithKDistinct(vector<int>& nums, int k) {
        return atMost(nums, k) - atMost(nums, k - 1);
    }

private:
    // Number of subarrays with at most K distinct values.
    int atMost(vector<int>& nums, int K) {
        unordered_map<int, int> count;
        int left = 0, total = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            count[nums[right]]++;
            while ((int)count.size() > K) {
                int v = nums[left++];
                if (--count[v] == 0) count.erase(v);
            }
            total += right - left + 1; // subarrays [left..right], [left+1..right], …, [right..right]
        }
        return total;
    }
};
