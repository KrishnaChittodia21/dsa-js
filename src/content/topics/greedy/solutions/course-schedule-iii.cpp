class Solution {
public:
    int scheduleCourse(vector<vector<int>>& courses) {
        vector<vector<int>> sorted = courses;
        sort(sorted.begin(), sorted.end(),
             [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; }); // earliest deadline first
        priority_queue<int> taken; // durations of chosen courses
        int time = 0;
        for (const auto& c : sorted) {
            int duration = c[0], lastDay = c[1];
            taken.push(duration);
            time += duration;
            if (time > lastDay) {
                time -= taken.top(); // drop the longest course: same count, least time used
                taken.pop();
            }
        }
        return taken.size();
    }
};
