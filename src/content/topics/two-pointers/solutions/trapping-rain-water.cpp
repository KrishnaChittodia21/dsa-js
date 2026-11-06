class Solution {
public:
    int trap(vector<int>& height) {
        int l = 0, r = (int) height.size() - 1;
        int leftMax = 0, rightMax = 0, water = 0;
        while (l < r) {
            leftMax = max(leftMax, height[l]);
            rightMax = max(rightMax, height[r]);
            if (leftMax < rightMax) {
                // Level at l is exactly leftMax: the right side is at least rightMax > leftMax.
                water += leftMax - height[l];
                l++;
            } else {
                // Level at r is exactly rightMax: the left side is at least leftMax >= rightMax.
                water += rightMax - height[r];
                r--;
            }
        }
        return water;
    }
};
