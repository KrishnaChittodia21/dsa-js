class Solution {
public:
    bool isNStraightHand(vector<int>& hand, int groupSize) {
        if (hand.size() % groupSize != 0) return false;
        map<int, int> count; // keys in sorted order
        for (int card : hand) count[card]++;
        for (auto& [v, c] : count) {
            if (c == 0) continue; // already used by earlier straights
            int need = c;
            // need straights must start at v (v is the smallest remaining value)
            for (int j = 0; j < groupSize; j++) {
                auto it = count.find(v + j);
                if (it == count.end() || it->second < need) return false;
                it->second -= need;
            }
        }
        return true;
    }
};
