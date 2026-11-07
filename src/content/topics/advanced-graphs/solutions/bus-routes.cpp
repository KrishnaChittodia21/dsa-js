class Solution {
public:
    int numBusesToDestination(vector<vector<int>>& routes, int source, int target) {
        if (source == target) return 0;

        unordered_map<int, vector<int>> stopToRoutes;
        for (int r = 0; r < (int) routes.size(); r++) {
            for (int s : routes[r]) stopToRoutes[s].push_back(r);
        }

        vector<bool> usedRoute(routes.size(), false);
        unordered_set<int> seenStop = {source};
        vector<int> frontier = {source};
        int buses = 0;

        while (!frontier.empty()) {
            buses++;                                     // everything found in this level needs one more bus
            vector<int> next;
            for (int stop : frontier) {
                auto it = stopToRoutes.find(stop);
                if (it == stopToRoutes.end()) continue;
                for (int r : it->second) {
                    if (usedRoute[r]) continue;
                    usedRoute[r] = true;                 // each route is scanned once in total
                    for (int s : routes[r]) {
                        if (s == target) return buses;
                        if (seenStop.insert(s).second) next.push_back(s);
                    }
                }
            }
            frontier = next;
        }
        return -1;
    }
};
