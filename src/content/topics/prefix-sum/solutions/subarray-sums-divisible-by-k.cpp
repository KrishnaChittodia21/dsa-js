class Solution {
public:
    int subarraysDivByK(vector<int>& nums, int k) {
        vector<int> count(k, 0);
        count[0] = 1;                         // empty prefix has remainder 0
        int rem = 0, total = 0;
        for (int x : nums) {
            rem = ((rem + x) % k + k) % k;    // always in 0..k-1, even for negatives
            total += count[rem];              // pair with every earlier equal remainder
            count[rem]++;
        }
        return total;
    }
};
