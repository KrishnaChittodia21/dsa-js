class RandomizedSet {
    vector<int> vals;                  // values, for O(1) random access
    unordered_map<int, int> pos;       // value -> index in vals

public:
    RandomizedSet() {
    }

    bool insert(int val) {
        if (pos.count(val)) return false;
        pos[val] = vals.size();
        vals.push_back(val);
        return true;
    }

    bool remove(int val) {
        auto it = pos.find(val);
        if (it == pos.end()) return false;
        int i = it->second;
        int last = vals.back();
        vals[i] = last;     // move the last element into the hole
        pos[last] = i;
        vals.pop_back();    // O(1): remove from the end
        pos.erase(val);     // last, so it also works when val == last
        return true;
    }

    int getRandom() {
        return vals[rand() % vals.size()];
    }
};
