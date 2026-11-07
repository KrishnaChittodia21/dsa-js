class Solution {
    public int sumSubarrayMins(int[] arr) {
        final long MOD = 1_000_000_007;
        int n = arr.length;
        int[] left = new int[n];  // choices for the left end
        int[] right = new int[n]; // choices for the right end
        Deque<Integer> st = new ArrayDeque<>();

        // previous STRICTLY smaller: pop while top >= current
        for (int i = 0; i < n; i++) {
            while (!st.isEmpty() && arr[st.peek()] >= arr[i]) st.pop();
            left[i] = i - (st.isEmpty() ? -1 : st.peek());
            st.push(i);
        }
        st.clear();
        // next smaller OR EQUAL: scan from the right, pop while top > current
        for (int i = n - 1; i >= 0; i--) {
            while (!st.isEmpty() && arr[st.peek()] > arr[i]) st.pop();
            right[i] = (st.isEmpty() ? n : st.peek()) - i;
            st.push(i);
        }

        long total = 0;
        for (int i = 0; i < n; i++) {
            total = (total + (long) arr[i] * left[i] * right[i]) % MOD; // term < 2^63, safe
        }
        return (int) total;
    }
}
