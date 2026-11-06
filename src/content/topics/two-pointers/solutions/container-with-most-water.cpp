class Solution {
public:
    int maxArea(vector<int>& height) {
        int l = 0, r = (int) height.size() - 1, best = 0;
        while (l < r) {
            int h = min(height[l], height[r]);
            best = max(best, h * (r - l));
            // The shorter line is the bottleneck: no narrower container can use it better.
            if (height[l] < height[r]) l++;
            else r--;
        }
        return best;
    }
};
