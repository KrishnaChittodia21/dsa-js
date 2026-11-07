class Solution {
    public long reverseBits(long n) {
        int x = (int) n;                // the 32-bit pattern of n
        int res = 0;
        for (int i = 0; i < 32; i++) {
            res = (res << 1) | (x & 1); // append x's lowest bit
            x >>>= 1;                   // logical shift (no sign smearing)
        }
        return res & 0xFFFFFFFFL;       // reinterpret as unsigned
    }
}
