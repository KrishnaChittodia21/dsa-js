class Solution {
public:
    int fib(int n) {
        unordered_map<int, int> memo;
        return go(n, memo);
    }

private:
    int go(int k, unordered_map<int, int>& memo) {
        if (k < 2) return k;                    // base cases: F(0) = 0, F(1) = 1
        auto it = memo.find(k);
        if (it != memo.end()) return it->second;
        int v = go(k - 1, memo) + go(k - 2, memo); // leap of faith on both smaller calls
        memo[k] = v;
        return v;
    }
};
