class Solution {
public:
    int hammingDistance(int x, int y) {
        unsigned d = (unsigned) x ^ (unsigned) y;   // 1 where the bits differ
        int count = 0;
        while (d != 0) {
            d &= d - 1;                             // remove one differing bit
            count++;
        }
        return count;
    }
};
