class Solution {
public:
    int totalFruit(vector<int>& fruits) {
        unordered_map<int, int> count; // type -> how many of it are in the window
        int left = 0, best = 0;
        for (int right = 0; right < (int)fruits.size(); right++) {
            count[fruits[right]]++;
            while (count.size() > 2) {                    // third type → repair
                int t = fruits[left];
                if (--count[t] == 0) count.erase(t);      // keep size = distinct types
                left++;
            }
            best = max(best, right - left + 1);
        }
        return best;
    }
};
