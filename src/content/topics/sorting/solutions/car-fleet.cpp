class Solution {
public:
    int carFleet(int target, vector<int>& position, vector<int>& speed) {
        int n = position.size();
        vector<pair<int, double>> cars(n);
        for (int i = 0; i < n; i++)
            cars[i] = {position[i], (double)(target - position[i]) / speed[i]};
        sort(cars.begin(), cars.end(), [](auto& a, auto& b) { return a.first > b.first; }); // closest to the target first

        int fleets = 0;
        double lead = 0;                           // arrival time of the fleet ahead
        for (auto& [pos, time] : cars) {
            if (time > lead) {                     // arrives strictly later -> new fleet
                fleets++;
                lead = time;
            }                                      // else it catches up and merges
        }
        return fleets;
    }
};
