class Solution {
public:
    int sumSubarrayMins(vector<int>& arr) {
        const long long MOD = 1'000'000'007;
        int n = arr.size();
        vector<int> left(n);  // choices for the left end
        vector<int> right(n); // choices for the right end
        stack<int> st;

        // previous STRICTLY smaller: pop while top >= current
        for (int i = 0; i < n; i++) {
            while (!st.empty() && arr[st.top()] >= arr[i]) st.pop();
            left[i] = i - (st.empty() ? -1 : st.top());
            st.push(i);
        }
        st = stack<int>();
        // next smaller OR EQUAL: scan from the right, pop while top > current
        for (int i = n - 1; i >= 0; i--) {
            while (!st.empty() && arr[st.top()] > arr[i]) st.pop();
            right[i] = (st.empty() ? n : st.top()) - i;
            st.push(i);
        }

        long long total = 0;
        for (int i = 0; i < n; i++) {
            total = (total + (long long) arr[i] * left[i] * right[i]) % MOD; // term < 2^63, safe
        }
        return (int) total;
    }
};
