class RangeModule {
    vector<pair<int, int>> iv;   // sorted, disjoint, non-touching [start, end) pairs

    // first index whose interval satisfies pred (pred must be false...false,true...true)
    template <typename Pred>
    int firstIdx(Pred pred) {
        return partition_point(iv.begin(), iv.end(), [&](const pair<int, int>& p) { return !pred(p); }) - iv.begin();
    }

public:
    RangeModule() {
    }

    void addRange(int left, int right) {
        int i = firstIdx([&](const pair<int, int>& p) { return p.second >= left; });   // first interval touching/after left
        int j = i;
        while (j < (int) iv.size() && iv[j].first <= right) {   // overlaps or touches [left, right)
            left = min(left, iv[j].first);
            right = max(right, iv[j].second);
            j++;
        }
        iv.erase(iv.begin() + i, iv.begin() + j);
        iv.insert(iv.begin() + i, {left, right});
    }

    bool queryRange(int left, int right) {
        int k = firstIdx([&](const pair<int, int>& p) { return p.first > left; }) - 1;   // last interval starting at/before left
        return k >= 0 && iv[k].second >= right;
    }

    void removeRange(int left, int right) {
        int i = firstIdx([&](const pair<int, int>& p) { return p.second > left; });    // first interval reaching past left
        int j = i;
        vector<pair<int, int>> pieces;
        while (j < (int) iv.size() && iv[j].first < right) {
            auto [start, end] = iv[j];
            if (start < left) pieces.push_back({start, left});   // keep the part before the cut
            if (end > right) pieces.push_back({right, end});     // keep the part after the cut
            j++;
        }
        iv.erase(iv.begin() + i, iv.begin() + j);
        iv.insert(iv.begin() + i, pieces.begin(), pieces.end());
    }
};
