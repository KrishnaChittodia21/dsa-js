class Solution {
public:
    void moveZeroes(vector<int>& nums) {
        int write = 0; // next position for a non-zero
        for (int read = 0; read < (int) nums.size(); read++) {
            if (nums[read] != 0) {
                swap(nums[write], nums[read]);
                write++;
            }
        }
    }
};
