class Solution {
public:
    bool haveConflict(vector<string>& event1, vector<string>& event2) {
        // Closed intervals overlap iff each starts no later than the other ends.
        // "HH:MM" strings are fixed-width, so string order == time order.
        return event1[0] <= event2[1] && event2[0] <= event1[1];
    }
};
