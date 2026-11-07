class Solution {
public:
    bool canReorderDoubled(vector<int>& arr) {
        unordered_map<int, int> count;
        for (int x : arr) count[x]++;

        vector<int> keys;
        for (auto& [x, c] : count) keys.push_back(x);
        sort(keys.begin(), keys.end(), [](int a, int b) { return abs(a) < abs(b); });
        for (int x : keys) {
            int c = count[x];
            if (c == 0) continue;                  // all copies already used as doubles
            if (x == 0) {
                if (c % 2 != 0) return false;      // zeros pair with zeros
                continue;
            }
            auto it = count.find(2 * x);
            int doubles = it == count.end() ? 0 : it->second;
            if (doubles < c) return false;         // x's partner is forced to be 2x
            count[2 * x] = doubles - c;
        }
        return true;
    }
};
