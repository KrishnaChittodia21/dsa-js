class TimeMap {
public:
    TimeMap() {
    }

    void set(string key, string value, int timestamp) {
        times[key].push_back(timestamp);   // timestamps increase → stays sorted
        values[key].push_back(value);
    }

    string get(string key, int timestamp) {
        auto it = times.find(key);
        if (it == times.end()) return "";
        const vector<int>& ts = it->second;
        // first index with ts[i] > timestamp (upper bound)
        int lo = 0, hi = ts.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (ts[mid] > timestamp) hi = mid;
            else lo = mid + 1;
        }
        return lo == 0 ? "" : values[key][lo - 1];
    }

private:
    unordered_map<string, vector<int>> times;
    unordered_map<string, vector<string>> values;
};
