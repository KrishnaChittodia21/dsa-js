class RandomizedCollection {
    vector<int> vals;                                  // one slot per copy
    unordered_map<int, unordered_set<int>> idx;        // value -> indices in vals

public:
    RandomizedCollection() {
    }

    bool insert(int val) {
        auto& slots = idx[val];
        bool wasAbsent = slots.empty();
        slots.insert(vals.size());
        vals.push_back(val);
        return wasAbsent;
    }

    bool remove(int val) {
        auto it = idx.find(val);
        if (it == idx.end() || it->second.empty()) return false;
        auto& slots = it->second;
        int i = *slots.begin();                     // any copy of val
        slots.erase(i);

        int lastIdx = vals.size() - 1;
        int last = vals[lastIdx];
        vals[i] = last;                             // move last element into the hole
        auto& lastSlots = idx[last];
        lastSlots.insert(i);                        // add first...
        lastSlots.erase(lastIdx);                   // ...then delete (handles i == lastIdx)
        vals.pop_back();

        if (slots.empty()) idx.erase(val);
        return true;
    }

    int getRandom() {
        return vals[rand() % vals.size()];
    }
};
