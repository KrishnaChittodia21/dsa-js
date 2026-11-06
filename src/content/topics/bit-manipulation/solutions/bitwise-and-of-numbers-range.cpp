class Solution {
public:
    int rangeBitwiseAnd(int left, int right) {
        int shift = 0;
        while (left != right) {   // strip the differing low bits
            left >>= 1;
            right >>= 1;
            shift++;
        }
        return left << shift;     // common prefix followed by zeros
    }
};
