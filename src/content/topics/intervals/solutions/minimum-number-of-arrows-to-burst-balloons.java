class Solution {
    public int findMinArrowShots(int[][] points) {
        int[][] sorted = points.clone();
        // Integer.compare, not a[1] - b[1]: the subtraction overflows near ±2^31
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[1], b[1]));
        int arrows = 0;
        long arrowX = Long.MIN_VALUE; // below any int, so the first balloon always needs an arrow
        for (int[] p : sorted) {
            if (p[0] > arrowX) { // closed ranges: s == arrowX is still burst
                arrows++;
                arrowX = p[1]; // shoot as far right as this balloon allows
            }
        }
        return arrows;
    }
}
