class Solution {
public:
    int findPoisonedDuration(vector<int>& timeSeries, int duration) {
        int total = 0;
        for (size_t i = 0; i + 1 < timeSeries.size(); i++) {
            // poison lasts 'duration' unless the next attack resets it earlier
            total += min(duration, timeSeries[i + 1] - timeSeries[i]);
        }
        return total + duration; // the last attack always runs its full course
    }
};
