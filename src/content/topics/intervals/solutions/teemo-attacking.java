class Solution {
    public int findPoisonedDuration(int[] timeSeries, int duration) {
        int total = 0;
        for (int i = 0; i < timeSeries.length - 1; i++) {
            // poison lasts 'duration' unless the next attack resets it earlier
            total += Math.min(duration, timeSeries[i + 1] - timeSeries[i]);
        }
        return total + duration; // the last attack always runs its full course
    }
}
