class Solution {
public:
    long long reverseBits(long long n) {
        uint32_t x = (uint32_t) n;      // the 32-bit pattern of n; unsigned shifts are well defined
        uint32_t res = 0;
        for (int i = 0; i < 32; i++) {
            res = (res << 1) | (x & 1); // append x's lowest bit
            x >>= 1;
        }
        return res;                     // widened as unsigned
    }
};
