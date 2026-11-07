class Solution {
public:
    double myPow(double x, int n) {
        long long e = n;                        // long long: -INT_MIN overflows int
        if (e < 0) {                            // x^-n = (1/x)^n
            x = 1 / x;
            e = -e;
        }
        return pow(x, e);
    }

private:
    double pow(double x, long long e) {
        if (e == 0) return 1;                   // base case
        double half = pow(x, e / 2);            // ONE recursive call
        return e % 2 == 0 ? half * half : half * half * x;
    }
};
