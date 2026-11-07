class Solution {
    public int maxArea(int[] height) {
        int l = 0, r = height.length - 1, best = 0;
        while (l < r) {
            int h = Math.min(height[l], height[r]);
            best = Math.max(best, h * (r - l));
            // The shorter line is the bottleneck: no narrower container can use it better.
            if (height[l] < height[r]) l++;
            else r--;
        }
        return best;
    }
}
