class Solution {
    public int[] nextGreaterElements(int[] nums) {
        int n = nums.length;
        int[] res = new int[n];
        Arrays.fill(res, -1);
        Deque<Integer> st = new ArrayDeque<>(); // indices waiting; values non-increasing
        for (int k = 0; k < 2 * n; k++) {
            int i = k % n;
            while (!st.isEmpty() && nums[st.peek()] < nums[i]) {
                res[st.pop()] = nums[i];
            }
            if (k < n) st.push(i); // second lap only answers, never waits
        }
        return res;
    }
}
