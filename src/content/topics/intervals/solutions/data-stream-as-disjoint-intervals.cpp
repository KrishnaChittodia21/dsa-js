class SummaryRanges {
    vector<vector<int>> list; // sorted, disjoint, non-adjacent closed intervals

public:
    SummaryRanges() {
    }

    void addNum(int value) {
        // upper bound: first interval whose start > value
        int lo = 0, hi = list.size();
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            if (list[mid][0] <= value) lo = mid + 1;
            else hi = mid;
        }
        bool hasLeft = lo > 0;
        bool hasRight = lo < (int)list.size();

        if (hasLeft && list[lo - 1][1] >= value) return;      // already covered
        bool joinLeft = hasLeft && list[lo - 1][1] == value - 1;
        bool joinRight = hasRight && list[lo][0] == value + 1;

        if (joinLeft && joinRight) {                          // value glues two intervals
            list[lo - 1][1] = list[lo][1];
            list.erase(list.begin() + lo);
        } else if (joinLeft) {
            list[lo - 1][1] = value;
        } else if (joinRight) {
            list[lo][0] = value;
        } else {
            list.insert(list.begin() + lo, {value, value});
        }
    }

    vector<vector<int>> getIntervals() {
        return list; // returned by value: a copy
    }
};
