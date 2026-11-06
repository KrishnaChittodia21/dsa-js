class Solution {
public:
    bool canCross(vector<int>& stones) {
        // position -> set of jump sizes that can land on it
        unordered_map<int, unordered_set<int>> reach;
        for (int p : stones) reach[p];
        reach[0].insert(0);                          // "previous jump 0" -> first jump is exactly 1
        for (int pos : stones) {
            for (int k : reach[pos]) {
                for (int step = k - 1; step <= k + 1; step++) {
                    if (step <= 0) continue;         // must move forward
                    auto target = reach.find(pos + step);
                    if (target != reach.end()) target->second.insert(step); // there is a stone there
                }
            }
        }
        return !reach[stones.back()].empty();
    }
};
