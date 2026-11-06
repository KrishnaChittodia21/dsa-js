class Solution {
public:
    int heightChecker(vector<int>& heights) {
        int count[101] = {0};
        for (int h : heights) count[h]++;

        int mismatches = 0;
        int h = 1;                              // current height in the sorted line
        for (int x : heights) {
            while (count[h] == 0) h++;          // skip heights already used up
            if (x != h) mismatches++;
            count[h]--;
        }
        return mismatches;
    }
};
