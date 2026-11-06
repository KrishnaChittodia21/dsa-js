class Solution {
public:
    int timeRequiredToBuy(vector<int>& tickets, int k) {
        vector<int> left = tickets;  // do not mutate the input
        queue<int> q;
        for (int i = 0; i < (int)left.size(); i++) q.push(i);
        int time = 0;
        while (true) {
            int i = q.front();
            q.pop();
            left[i]--;
            time++;  // one second per ticket
            if (i == k && left[i] == 0) return time;
            if (left[i] > 0) q.push(i);  // back of the line
        }
    }
};
