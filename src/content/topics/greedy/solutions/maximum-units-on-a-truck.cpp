class Solution {
public:
    int maximumUnits(vector<vector<int>>& boxTypes, int truckSize) {
        vector<vector<int>> types = boxTypes;
        sort(types.begin(), types.end(), [](const vector<int>& a, const vector<int>& b) {
            return a[1] > b[1]; // most units per box first
        });
        int units = 0;
        for (const auto& t : types) {
            if (truckSize == 0) break;
            int take = min(t[0], truckSize);
            units += take * t[1];
            truckSize -= take;
        }
        return units;
    }
};
