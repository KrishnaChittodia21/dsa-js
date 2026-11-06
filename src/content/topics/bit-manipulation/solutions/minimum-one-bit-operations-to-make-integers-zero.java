class Solution {
    public int minimumOneBitOperations(int n) {
        int ans = 0;
        for (; n != 0; n >>= 1) {
            ans ^= n;          // inverse Gray code: XOR of n, n>>1, n>>2, ...
        }
        return ans;
    }
}
