class Solution {
public:
    int hammingWeight(long long n) {
        uint32_t x = (uint32_t) n;   // the 32-bit pattern of n
        int count = 0;
        while (x != 0) {
            x &= x - 1;              // drop the lowest set bit
            count++;
        }
        return count;
    }
};
