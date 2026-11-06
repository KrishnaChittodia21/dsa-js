class Solution {
public:
    int leastInterval(vector<char>& tasks, int n) {
        unordered_map<char, int> count;
        for (char t : tasks) count[t]++;
        priority_queue<int> heap;
        for (auto& [task, c] : count) heap.push(c);
        int time = 0;
        while (!heap.empty()) {
            vector<int> leftovers;
            int ran = 0;
            // one round: up to n + 1 DIFFERENT tasks, most frequent first
            while (ran < n + 1 && !heap.empty()) {
                int c = heap.top() - 1;
                heap.pop();
                if (c > 0) leftovers.push_back(c);
                ran++;
            }
            for (int c : leftovers) heap.push(c);
            time += heap.empty() ? ran : n + 1;   // last round has no trailing idle
        }
        return time;
    }
};
