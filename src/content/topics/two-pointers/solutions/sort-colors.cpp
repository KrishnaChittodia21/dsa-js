class Solution {
public:
    void sortColors(vector<int>& nums) {
        int low = 0, mid = 0, high = (int) nums.size() - 1;
        // [0, low) = 0s | [low, mid) = 1s | [mid, high] unknown | (high, end] = 2s
        while (mid <= high) {
            if (nums[mid] == 0) {
                swap(nums[low], nums[mid]);
                low++;
                mid++;
            } else if (nums[mid] == 1) {
                mid++;
            } else {
                swap(nums[mid], nums[high]);
                high--;                 // mid stays: the new nums[mid] is unclassified
            }
        }
    }
};
