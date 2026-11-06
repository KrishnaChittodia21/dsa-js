class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Map<Integer, Integer> next = new HashMap<>(); // value -> its next greater value in nums2
        Deque<Integer> stack = new ArrayDeque<>();    // values waiting, decreasing bottom -> top
        for (int x : nums2) {
            while (!stack.isEmpty() && stack.peek() < x) {
                next.put(stack.pop(), x);
            }
            stack.push(x);
        }
        int[] res = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) {
            res[i] = next.getOrDefault(nums1[i], -1);
        }
        return res;
    }
}
