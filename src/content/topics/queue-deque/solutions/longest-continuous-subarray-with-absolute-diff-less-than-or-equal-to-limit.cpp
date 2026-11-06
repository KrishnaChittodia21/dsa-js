class Solution {
public:
    int longestSubarray(vector<int>& nums, int limit) {
        deque<int> maxD;   // indices, nums decreasing → front is the window max
        deque<int> minD;   // indices, nums increasing → front is the window min
        int left = 0, best = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            int x = nums[right];
            while (!maxD.empty() && nums[maxD.back()] < x) maxD.pop_back();
            maxD.push_back(right);
            while (!minD.empty() && nums[minD.back()] > x) minD.pop_back();
            minD.push_back(right);

            while (nums[maxD.front()] - nums[minD.front()] > limit) {
                left++;                                       // shrink
                if (maxD.front() < left) maxD.pop_front();    // expired
                if (minD.front() < left) minD.pop_front();
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};
