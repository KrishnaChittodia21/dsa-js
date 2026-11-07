class Solution {
public:
    int majorityElement(vector<int>& nums) {
        int candidate = nums[0];
        int count = 0;
        for (int x : nums) {
            if (count == 0) candidate = x;      // nobody standing -> adopt x
            count += x == candidate ? 1 : -1;   // vote for / against
        }
        return candidate;                       // guaranteed to be the majority
    }
};
