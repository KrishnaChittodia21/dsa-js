class Solution {
public:
    int mySqrt(int x) {
        // first r with r * r > x, searched in [0, hi]; answer is r - 1
        long long lo = 0, hi = min(x, 46341) + 1;   // 46341^2 > 2^31 - 1
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (mid * mid > x) hi = mid;   // too big → root is left of mid
            else lo = mid + 1;
        }
        return lo - 1;
    }
};
