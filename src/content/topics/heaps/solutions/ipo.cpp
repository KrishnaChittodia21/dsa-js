class Solution {
public:
    int findMaximizedCapital(int k, int w, vector<int>& profits, vector<int>& capital) {
        int n = profits.size();
        vector<pair<int, int>> projects(n);  // {capital, profit}
        for (int i = 0; i < n; i++) projects[i] = {capital[i], profits[i]};
        sort(projects.begin(), projects.end());

        priority_queue<int> avail;           // profits of projects we can afford
        int i = 0;
        for (int round = 0; round < k; round++) {
            while (i < n && projects[i].first <= w) avail.push(projects[i++].second); // unlock
            if (avail.empty()) break;        // nothing affordable now or ever
            w += avail.top();                // choose the most profitable
            avail.pop();
        }
        return w;
    }
};
