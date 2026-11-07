class Solution {
public:
    int numRescueBoats(vector<int>& people, int limit) {
        vector<int> w = people;
        sort(w.begin(), w.end());
        int l = 0, r = (int) w.size() - 1, boats = 0;
        while (l <= r) {                       // l == r: one person left, needs a boat
            if (w[l] + w[r] <= limit) l++;     // lightest rides along
            r--;                               // heaviest always leaves
            boats++;
        }
        return boats;
    }
};
