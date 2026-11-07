class Solution {
public:
    vector<vector<int>> intervalIntersection(vector<vector<int>>& firstList, vector<vector<int>>& secondList) {
        vector<vector<int>> out;
        size_t i = 0, j = 0;
        while (i < firstList.size() && j < secondList.size()) {
            int lo = max(firstList[i][0], secondList[j][0]);
            int hi = min(firstList[i][1], secondList[j][1]);
            if (lo <= hi) out.push_back({lo, hi}); // closed: a single point counts
            if (firstList[i][1] < secondList[j][1]) i++; // the earlier-ending interval is done
            else j++;
        }
        return out;
    }
};
