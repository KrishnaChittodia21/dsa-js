class NumArray {
    vector<int> prefix; // prefix[i] = sum of the first i numbers; prefix[0] = 0 (empty prefix)

public:
    NumArray(vector<int>& nums) : prefix(nums.size() + 1, 0) {
        for (int i = 0; i < (int)nums.size(); i++) {
            prefix[i + 1] = prefix[i] + nums[i];
        }
    }

    int sumRange(int left, int right) {
        return prefix[right + 1] - prefix[left];
    }
};
