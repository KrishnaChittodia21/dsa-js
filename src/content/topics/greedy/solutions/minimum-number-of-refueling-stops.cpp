class Solution {
public:
    int minRefuelStops(int target, int startFuel, vector<vector<int>>& stations) {
        priority_queue<int> passed; // fuel of stations we drove past without stopping
        long long fuel = startFuel; // = farthest position reachable right now; can pass 2^31
        int stops = 0;
        size_t i = 0;
        while (fuel < target) {
            while (i < stations.size() && stations[i][0] <= fuel) {
                passed.push(stations[i][1]);
                i++;
            }
            if (passed.empty()) return -1; // stuck, and no station to regret
            fuel += passed.top();          // "we stopped at the best one"
            passed.pop();
            stops++;
        }
        return stops;
    }
};
