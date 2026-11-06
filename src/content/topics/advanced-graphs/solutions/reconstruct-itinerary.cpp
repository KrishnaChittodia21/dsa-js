class Solution {
public:
    vector<string> findItinerary(vector<vector<string>>& tickets) {
        unordered_map<string, vector<string>> adj;
        for (auto& t : tickets) adj[t[0]].push_back(t[1]);
        // Descending order → pop_back() returns the lexically smallest destination in O(1)
        for (auto& [from, list] : adj) sort(list.rbegin(), list.rend());

        vector<string> stack = {"JFK"};
        vector<string> route;
        while (!stack.empty()) {
            auto it = adj.find(stack.back());
            if (it != adj.end() && !it->second.empty()) {
                stack.push_back(it->second.back());  // use one ticket
                it->second.pop_back();
            } else {
                route.push_back(stack.back());       // dead end: this airport is fixed at the end
                stack.pop_back();
            }
        }
        reverse(route.begin(), route.end());
        return route;
    }
};
