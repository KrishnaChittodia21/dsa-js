class LFUCache {
    struct Entry {
        int value, freq;
        list<int>::iterator pos;                 // position in its frequency bucket
    };
    int cap;
    int minFreq = 0;
    unordered_map<int, Entry> keyMap;
    unordered_map<int, list<int>> freqMap;       // freq -> keys, least recent at the front

    void touch(int key, Entry& e) {
        int f = e.freq;
        list<int>& bucket = freqMap[f];
        bucket.erase(e.pos);
        if (bucket.empty()) {
            freqMap.erase(f);
            if (minFreq == f) minFreq = f + 1;
        }
        e.freq = f + 1;
        list<int>& next = freqMap[f + 1];
        e.pos = next.insert(next.end(), key);
    }

public:
    LFUCache(int capacity) : cap(capacity) {}

    int get(int key) {
        auto it = keyMap.find(key);
        if (it == keyMap.end()) return -1;
        touch(key, it->second);
        return it->second.value;
    }

    void put(int key, int value) {
        if (cap == 0) return;
        auto it = keyMap.find(key);
        if (it != keyMap.end()) {
            it->second.value = value;
            touch(key, it->second);
            return;
        }
        if ((int) keyMap.size() >= cap) {
            list<int>& bucket = freqMap[minFreq];
            int victim = bucket.front();         // least recent among least frequent
            bucket.pop_front();
            if (bucket.empty()) freqMap.erase(minFreq);
            keyMap.erase(victim);
        }
        list<int>& ones = freqMap[1];
        keyMap[key] = {value, 1, ones.insert(ones.end(), key)};
        minFreq = 1;
    }
};
