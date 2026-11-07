class Solution {
public:
    vector<int> singleNumber(vector<int>& nums) {
        unsigned x = 0;
        for (int v : nums) x ^= v;       // x = a ^ b
        unsigned d = x & -x;             // lowest bit where a and b differ (unsigned: -INT_MIN is UB)
        int a = 0;
        for (int v : nums) {
            if (v & d) a ^= v;           // group with bit d set
        }
        return {a, (int) (x ^ a)};
    }
};
