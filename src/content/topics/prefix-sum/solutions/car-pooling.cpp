class Solution {
public:
    bool carPooling(vector<vector<int>>& trips, int capacity) {
        int maxPos = 0;
        for (auto& t : trips) maxPos = max(maxPos, t[2]);
        vector<int> diff(maxPos + 1, 0);
        for (auto& t : trips) {
            diff[t[1]] += t[0]; // board at from
            diff[t[2]] -= t[0]; // leave AT to (half-open [from, to))
        }
        int load = 0;
        for (int km = 0; km <= maxPos; km++) {
            load += diff[km];
            if (load > capacity) return false;
        }
        return true;
    }
};
