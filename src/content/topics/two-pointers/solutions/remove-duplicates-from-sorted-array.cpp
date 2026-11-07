class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        int write = 1; // nums[0] is always kept
        for (int read = 1; read < (int) nums.size(); read++) {
            if (nums[read] != nums[write - 1]) {
                nums[write] = nums[read];
                write++;
            }
        }
        return write;
    }
};
