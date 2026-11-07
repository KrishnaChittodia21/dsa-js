class RangeFreqQuery {
    unordered_map<int, vector<int>> positions;   // value -> sorted list of indices

public:
    RangeFreqQuery(vector<int>& arr) {
        for (int i = 0; i < (int) arr.size(); i++) positions[arr[i]].push_back(i);   // scanning left→right keeps it sorted
    }

    int query(int left, int right, int value) {
        auto it = positions.find(value);
        if (it == positions.end()) return 0;
        const vector<int>& list = it->second;
        return lower_bound(list.begin(), list.end(), right + 1) - lower_bound(list.begin(), list.end(), left);
    }
};
