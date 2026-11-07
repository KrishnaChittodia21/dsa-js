class Solution {
public:
    string predictPartyVictory(string senate) {
        int n = senate.size();
        queue<int> radiant, dire;
        for (int i = 0; i < n; i++) (senate[i] == 'R' ? radiant : dire).push(i);

        while (!radiant.empty() && !dire.empty()) {
            int r = radiant.front(), d = dire.front();
            radiant.pop();
            dire.pop();
            // The earlier senator acts first and bans the other one.
            if (r < d) radiant.push(r + n);  // acts again next round
            else dire.push(d + n);
        }
        return radiant.empty() ? "Dire" : "Radiant";
    }
};
